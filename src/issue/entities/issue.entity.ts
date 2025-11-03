import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Feedback } from 'src/feedback/entities/feedback.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'text', nullable: true })
  codeSnippet?: string;

  // ✅ JSON column for S3 attachment objects
  @Column({ type: 'json', nullable: true })
  attachments?: { name: string; url: string }[];

@ManyToOne(() => User, (user) => user.issues, { eager: true })
@JoinColumn({ name: 'createdById' })
createdBy: User;

@Column()
createdById: number;


  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Feedback, (feedback) => feedback.issue)
  feedbacks: Feedback[];
}
