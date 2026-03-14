import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(options: {
    skip?: number;
    limit?: number;
    site?: string;
    keyword?: string;
  }) {
    const { skip = 0, limit = 100, site, keyword } = options;
    const supabase = this.supabaseService.getClient();

    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(skip, skip + limit - 1);

      if (site) {
        query = query.eq('site', site);
      }

      if (keyword) {
        query = query.ilike('title', `%${keyword}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        
        // 테이블이 없는 경우 더 명확한 메시지 제공
        if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
          throw new Error(
            `테이블 'jobs'를 찾을 수 없습니다. Supabase 대시보드에서 테이블을 생성해주세요.\n` +
            `SQL Editor에서 다음 SQL을 실행하세요:\n` +
            `CREATE TABLE IF NOT EXISTS jobs (...);\n` +
            `자세한 내용은 backend/SUPABASE_SETUP.md를 참고하세요.`
          );
        }
        
        throw new Error(`Error fetching jobs: ${error.message} (Code: ${error.code})`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async create(createJobDto: CreateJobDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('jobs')
      .insert(createJobDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating job: ${error.message}`);
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('jobs').delete().eq('id', id);

    if (error) {
      throw new Error(`Error deleting job: ${error.message}`);
    }
  }

  async upsertJobs(jobs: CreateJobDto[]): Promise<number> {
    const supabase = this.supabaseService.getClient();
    let savedCount = 0;

    for (const jobData of jobs) {
      try {
        // Check if job exists by link
        const { data: existing } = await supabase
          .from('jobs')
          .select('id')
          .eq('link', jobData.link)
          .single();

        if (existing) {
          // Update existing job
          const { error } = await supabase
            .from('jobs')
            .update(jobData)
            .eq('link', jobData.link);

          if (error) {
            console.error(`Error updating job ${jobData.title}:`, error);
            continue;
          }
        } else {
          // Insert new job
          const { error } = await supabase.from('jobs').insert(jobData);

          if (error) {
            console.error(`Error inserting job ${jobData.title}:`, error);
            continue;
          }
        }
        savedCount++;
      } catch (error) {
        console.error(`Error saving job ${jobData.title}:`, error);
      }
    }

    return savedCount;
  }
}

