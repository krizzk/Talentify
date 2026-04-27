import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { CV } from '../../cv/entities/cv.entity';

@Entity('ats_results')
export class ATSResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cv_id' })
  cvId: string;

  @ManyToOne(() => CV, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_id' })
  cv: CV;

  @Column()
  score: number;

  @Column({ type: 'text', name: 'job_description' })
  jobDescription: string;

  @Column({ type: 'jsonb', name: 'matched_keywords' })
  matchedKeywords: string[];

  @Column({ type: 'jsonb', name: 'missing_keywords' })
  missingKeywords: string[];

  @Column({ type: 'jsonb' })
  suggestions: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
