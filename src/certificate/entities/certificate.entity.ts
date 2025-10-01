import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Certificate {
    @PrimaryGeneratedColumn()
    certificateID: number;

    @ManyToOne(() => User, user => user.certificates)
    userId: User;

    @Column()
    name: string;

    @Column()
    type: string;

    @Column()
    issuingOrganization: string;

    @Column()
    issueDate: Date;

    @Column()
    expiryDate: Date;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'varchar', nullable: true })
    certificateFile: string;
}
