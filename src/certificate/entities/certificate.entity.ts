import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Certificate {
    @PrimaryGeneratedColumn('uuid') // or 'increment' if you prefer auto-incrementing IDs
    certificateID: string;

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
    expireDate: Date;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'varchar', nullable: true })
    certificateFile: string; // Assuming this stores the file path or URL
}
