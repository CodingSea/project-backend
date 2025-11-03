import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Issue } from 'src/issue/entities/issue.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  attachments?: { name: string; url: string }[];

  @Column({ default: false })
  isAccepted: boolean;

  @ManyToOne(() => Issue, issue => issue.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' }) 
  issue: Issue;

  @Column()
  issueId: number;

  @ManyToOne(() => User, user => user.issues, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => Comment, (comment) => comment.feedback, { cascade: true })
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
