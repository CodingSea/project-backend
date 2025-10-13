import { Card } from 'src/card/entities/card.entity';
import { Service } from 'src/service/entities/service.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';

@Entity()
export class TaskBoard
{
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Service, (service) => service.taskBoard)
    @JoinColumn()
    service: Service;

    @OneToMany(() => Card, (card) => card.taskBoard, { cascade: true })
    cards: Card[];
}