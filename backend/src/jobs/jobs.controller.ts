import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('site') site?: string,
    @Query('keyword') keyword?: string,
  ) {
    try {
      const skipNum = skip ? parseInt(skip, 10) : 0;
      const limitNum = limit ? parseInt(limit, 10) : 100;
      
      const jobs = await this.jobsService.findAll({
        skip: skipNum,
        limit: limitNum,
        site,
        keyword,
      });
      return {
        success: true,
        count: jobs.length,
        jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        jobs: [],
        count: 0,
      };
    }
  }

  @Post()
  async create(@Body() createJobDto: CreateJobDto) {
    try {
      const job = await this.jobsService.create(createJobDto);
      return {
        success: true,
        job,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.jobsService.remove(id);
    return {
      success: true,
      message: 'Job deleted successfully',
    };
  }
}

