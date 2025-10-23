import { Card } from 'src/card/entities/card.entity';
import { Service } from 'src/service/entities/service.entity';
import { Entity, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';

@Entity()
export class TaskBoard
{
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Service, (service) => service.taskBoard, { onDelete: 'CASCADE', nullable: true })
    service: Service;

    @OneToMany(() => Card, (card) => card.taskBoard, { cascade: true })
    cards: Card[];
}