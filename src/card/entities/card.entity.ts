import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Entity()
export class Card 
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    column: string;

    @Column()
    title: string;

    @Column()
    description: string;

    @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
    comments: Comment[];

    @ManyToOne(() => TaskBoard, (taskBoard) => taskBoard.cards)
    taskBoard: TaskBoard;

    @Column('varchar', { array: true, nullable: true })
    tags: string[];

    @Column({ nullable: true })
    order: number;

    @Column({ nullable: true })
    color: string;
}
