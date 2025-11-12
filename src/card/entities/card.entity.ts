// src/card/entities/card.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
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

  // ✅ Multiple users assigned to a card (many-to-many)
  @ManyToMany(() => User, (user) => user.cards, { nullable: true })
  @JoinTable({
    name: 'user_card', // name of the join table
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users?: User[];


}
