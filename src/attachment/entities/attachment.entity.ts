import { Entity, Column } from 'typeorm';
import { Feedback } from 'src/feedback/entities/feedback.entity';

@Entity()
export class Attachment 
{
    @Column()
    fileName: string;

    @Column()
    fileType: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
