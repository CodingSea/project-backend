import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Feedback } from 'src/feedback/entities/feedback.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Feedback, (feedback) => feedback.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feedbackId' })
  feedback: Feedback;

  @Column()
  feedbackId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
