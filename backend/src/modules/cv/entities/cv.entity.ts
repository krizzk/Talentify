import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CVType {
  GENERATED = 'generated',
  TAILORED = 'tailored',
}

export enum CVStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
}

@Entity('cvs')
export class CV {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'jsonb' })
  content: any;

  @Column({ name: 'plain_text', type: 'text', nullable: true })
  plainText: string;

  @Column({ type: 'enum', enum: CVType, default: CVType.GENERATED })
  type: CVType;

  @Column({ name: 'parent_cv_id', nullable: true })
  parentCvId: string;

  @Column({ type: 'enum', enum: CVStatus, default: CVStatus.DRAFT })
  status: CVStatus;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
