import { Test, TestingModule } from '@nestjs/testing';
import { MlClientService } from './ml-client.service';

describe('MlClientService', () => {
  let service: MlClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MlClientService],
    }).compile();

    service = module.get<MlClientService>(MlClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
