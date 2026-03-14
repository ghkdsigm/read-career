import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateJobDto {
  @IsString()
  company_name: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  posted_date?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsString()
  link: string;

  @IsString()
  site: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}

