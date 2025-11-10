import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { User } from 'src/user/entities/user.entity'; // ✅ Import User entity

@Entity()
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  column: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => TaskBoard, (taskBoard) => taskBoard.cards, { onDelete: 'CASCADE' })
  taskBoard: TaskBoard;

  @Column('varchar', { array: true, nullable: true })
  tags: string[];

  @Column({ nullable: true })
  order: number;

  @Column({ nullable: true })
  color: string;

  // ✅ NEW — Assigned User (nullable, eager loaded)
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser?: User;
}
