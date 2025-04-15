import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SensorStatus, AlertStatus, SensorLog, Role } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { AlertService } from '../alert/alert.service';
import { MailService } from '../mail/mail.service';
import { CreateAlertDto } from '../alert/dto/create-alert.dto';

const SENSOR_TYPE_TEMPERATURE = 'TEMPERATURE';
const SENSOR_TYPE_HUMIDITY = 'HUMIDITY';
const SENSOR_TYPE_TEMP_HUMID = 'TEMP_HUMID';

@Injectable()
export class WeatherApiSimulationService {
  private readonly logger = new Logger(WeatherApiSimulationService.name);
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly alertService: AlertService,
    private readonly mailService: MailService,
  ) {
    this.apiKey = this.configService.get<string>('WEATHERAPI_API_KEY');
    if (!this.apiKey) {
      this.logger.error(
        'WeatherAPI Key not found in environment variables (WEATHERAPI_API_KEY)!',
      );
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    if (!this.apiKey) {
      this.logger.warn(
        'Skipping WeatherAPI simulation due to missing API key.',
      );
      return;
    }
    this.logger.log('Running WeatherAPI-based sensor simulation...');

    // type SensorForSimulation = Pick<
    //   Sensor,
    //   'id' | 'name' | 'type' | 'location' | 'threshold' | 'zoneId' | 'status'
    // >;

    const zones = await this.prisma.zone.findMany({
      where: {
        OR: [
          { city: { not: null } },
          { AND: [{ latitude: { not: null } }, { longitude: { not: null } }] },
        ],
        sensors: { some: { status: SensorStatus.ACTIVE } },
      },
      include: {
        sensors: {
          where: { status: SensorStatus.ACTIVE },
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
            threshold: true,
            zoneId: true,
            status: true,
          },
        },
      },
    });

    if (zones.length === 0) {
      this.logger.log(
        'No active zones with valid locations and active sensors found.',
      );
      return;
    }

    for (const zone of zones) {
      if (!zone.sensors || zone.sensors.length === 0) continue;

      let locationQueryParam: string;
      let locationIdentifierForLog: string;

      if (zone.latitude !== null && zone.longitude !== null) {
        locationQueryParam = `${zone.latitude},${zone.longitude}`;
        locationIdentifierForLog = `Lat/Lon (${locationQueryParam})`;
      } else if (zone.city !== null) {
        locationQueryParam = encodeURIComponent(zone.city);
        locationIdentifierForLog = `City (${zone.city})`;
      } else {
        this.logger.warn(
          `Zone ${zone.id} (${zone.name}) has invalid location data. Skipping.`,
        );
        continue;
      }

      const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${locationQueryParam}&aqi=no`;

      try {
        const response = await firstValueFrom(this.httpService.get(apiUrl));
        const weatherData = response.data;

        if (weatherData && weatherData.current) {
          const outdoorTemp = weatherData.current.temp_c;
          const outdoorHumidity = weatherData.current.humidity;
          this.logger.debug(
            `Weather for Zone ${zone.name} (${locationIdentifierForLog}): Temp=${outdoorTemp}°C, Humidity=${outdoorHumidity}%`,
          );

          for (const sensor of zone.sensors) {
            let simulatedTemp: number | null = null;
            let simulatedHumidity: number | null = null;

            const baseDcTemp = 22;
            const baseDcHumidity = 45;
            const tempInfluence = (outdoorTemp - 15) * 0.1;
            const humidityInfluence = (outdoorHumidity - 50) * 0.05;
            const internalTempNoise = (Math.random() - 0.5) * 1;
            const internalHumidityNoise = (Math.random() - 0.5) * 2;

            if (
              sensor.type === SENSOR_TYPE_TEMPERATURE ||
              sensor.type === SENSOR_TYPE_TEMP_HUMID
            ) {
              simulatedTemp = baseDcTemp + tempInfluence + internalTempNoise;
              simulatedTemp = parseFloat(simulatedTemp.toFixed(2));

              const shouldExceed = Math.random() < 0.05;
              if (shouldExceed && sensor.threshold !== null) {
                simulatedTemp = sensor.threshold + Math.random() * 2;
                this.logger.warn(
                  `SIMULATING TEMP THRESHOLD EXCEEDED for sensor ${sensor.id}`,
                );
              } else if (
                sensor.threshold !== null &&
                simulatedTemp >= sensor.threshold
              ) {
                this.logger.warn(
                  `Simulated temp ${simulatedTemp}°C naturally meets/exceeds threshold ${sensor.threshold}°C for ${sensor.id}`,
                );
              } else if (sensor.threshold !== null) {
                simulatedTemp = Math.min(simulatedTemp, sensor.threshold - 0.5);
              }
            }

            if (
              sensor.type === SENSOR_TYPE_HUMIDITY ||
              sensor.type === SENSOR_TYPE_TEMP_HUMID
            ) {
              simulatedHumidity =
                baseDcHumidity + humidityInfluence + internalHumidityNoise;
              simulatedHumidity = Math.max(
                0,
                Math.min(100, parseFloat(simulatedHumidity.toFixed(2))),
              );
            }

            let createdLog: SensorLog | null = null;
            if (simulatedTemp !== null || simulatedHumidity !== null) {
              try {
                createdLog = await this.prisma.sensorLog.create({
                  data: {
                    sensorId: sensor.id,
                    temperature: simulatedTemp,
                    humidity: simulatedHumidity,
                  },
                });
                this.logger.log(
                  `Created log ${createdLog.id} for sensor ${sensor.id}: Temp=${simulatedTemp}, Humid=${simulatedHumidity}`,
                );
                await this.checkAndTriggerAlert(sensor, createdLog);
              } catch (dbError) {
                this.logger.error(
                  `Failed to create SensorLog for sensor ${sensor.id}: ${dbError.message}`,
                  dbError.stack,
                );
              }
            }
          }
        } else {
          this.logger.warn(
            `No current weather data received for Zone ${zone.name} (${locationIdentifierForLog})`,
          );
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          const apiErrorMessage =
            error.response?.data?.error?.message || error.message;
          this.logger.error(
            `Error fetching weather for Zone ${zone.name} (${locationIdentifierForLog}): ${error.response?.status} ${apiErrorMessage}`,
          );
        } else {
          this.logger.error(
            `Error processing Zone ${zone.name} (${locationIdentifierForLog}): ${error.message}`,
            error.stack,
          );
        }
      }
    }
    this.logger.log('WeatherAPI-based sensor simulation finished.');
  }

  private async checkAndTriggerAlert(
    sensor: {
      id: string;
      name: string;
      location: string;
      type: string;
      threshold: number | null;
    },
    log: SensorLog,
  ) {
    if (!log) return;

    let alertMessage: string | null = null;

    if (
      (sensor.type === SENSOR_TYPE_TEMPERATURE ||
        sensor.type === SENSOR_TYPE_TEMP_HUMID) &&
      sensor.threshold !== null &&
      log.temperature !== null &&
      log.temperature >= sensor.threshold
    ) {
      alertMessage = `Nhiệt độ ${log.temperature.toFixed(1)}°C vượt ngưỡng ${sensor.threshold.toFixed(1)}°C cho cảm biến '${sensor.name}' tại '${sensor.location}'.`;
      // Removed unused assignment to thresholdValue
      this.logger.warn(
        `ALERT CONDITION MET (Temperature): Sensor ${sensor.id}, Value ${log.temperature}, Threshold ${sensor.threshold}`,
      );
    }

    if (alertMessage) {
      const existingPendingAlert = await this.prisma.alert.findFirst({
        where: { sensorId: sensor.id, status: AlertStatus.PENDING },
        select: { id: true },
      });

      if (existingPendingAlert) {
        this.logger.log(
          `Skipping new alert for sensor ${sensor.id}. PENDING alert ${existingPendingAlert.id} exists.`,
        );
        return;
      }

      this.logger.log(
        `Proceeding to create new alert for sensor ${sensor.id}...`,
      );
      let newAlert;
      try {
        const createAlertDtoData: CreateAlertDto = {
          message: alertMessage,
          sensorId: sensor.id,
          viaEmail: true,
        };
        newAlert = await this.alertService.create(createAlertDtoData);
        this.logger.log(
          `Created Alert ${newAlert.id} for sensor ${sensor.id}.`,
        );
      } catch (alertCreateError) {
        this.logger.error(
          `Failed to create Alert for sensor ${sensor.id}: ${alertCreateError.message}`,
          alertCreateError.stack,
        );
        return;
      }

      if (newAlert) {
        try {
          const usersToNotify = await this.prisma.user.findMany({
            where: { role: Role.ADMIN, isActive: true },
            select: { email: true, id: true },
          });

          if (usersToNotify.length > 0) {
            this.logger.log(
              `Notifying ${usersToNotify.length} users for alert ${newAlert.id}.`,
            );
            const subject = `🔥 Cảnh báo khẩn cấp: ${sensor.name}`;
            for (const user of usersToNotify) {
              try {
                await this.mailService.sendAlertEmail(
                  user.email,
                  subject,
                  alertMessage,
                  null,
                );
                this.logger.log(
                  `Sent alert email to ${user.email} for alert ${newAlert.id}.`,
                );
              } catch (mailError) {
                this.logger.error(
                  `Failed to send email to ${user.email} for alert ${newAlert.id}: ${mailError.message}`,
                  mailError.stack,
                );
              }
            }
          } else {
            this.logger.warn(
              `No active admin users found to notify for alert ${newAlert.id}.`,
            );
          }
        } catch (userFetchError) {
          this.logger.error(
            `Failed to fetch users for notification (Alert ${newAlert.id}): ${userFetchError.message}`,
            userFetchError.stack,
          );
        }
      }
    }
  }
}
