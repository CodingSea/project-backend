import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Service } from 'src/service/entities/service.entity';
import { Card } from 'src/card/entities/card.entity';

@Entity()
export class Comment
{
    @PrimaryGeneratedColumn()
    commentID: number;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @ManyToOne(() => Service, (service) => service.comments, { onDelete: 'CASCADE' })
    service: Service;

    @ManyToOne(() => Card, (card) => card.comments, { onDelete: 'CASCADE' })
    card: Card;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn()
    dateTime: Date;
}
