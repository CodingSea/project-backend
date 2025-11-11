import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { User } from 'src/user/entities/user.entity';

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

  @ManyToOne(() => TaskBoard, (taskBoard) => taskBoard.cards, {
    onDelete: 'CASCADE',
  })
  taskBoard: TaskBoard;

  @Column('varchar', { array: true, nullable: true })
  tags: string[];

  @Column({ nullable: true })
  order: number;

  @Column({ nullable: true })
  color: string;

  // ✅ Multiple assigned users
  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'card_assigned_users',
    joinColumn: { name: 'cardId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  assignedUsers?: User[];

  // (If you want to keep comments relation here, add it, you didn't include it in the snippet)
}
