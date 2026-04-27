import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id' })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.educations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column()
  institution: string;

  @Column({ nullable: true })
  degree: string;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true, type: 'numeric', precision: 3, scale: 2 })
  gpa: number;

  @Column({ nullable: true, type: 'integer' })
  start_year: number;

  @Column({ nullable: true, type: 'integer' })
  end_year: number;

  @Column({ default: () => 'now()', type: 'timestamp' })
  created_at: Date;
}
