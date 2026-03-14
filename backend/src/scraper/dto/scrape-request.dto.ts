import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class ScrapeRequestDto {
  @IsString()
  site: string = 'jobkorea';

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  max_pages?: number = 1;
}

