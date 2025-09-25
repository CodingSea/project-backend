import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Service } from 'src/service/entities/service.entity';

@Entity()
export class Project
{
    @PrimaryGeneratedColumn()
    projectID: number;
  
    @Column({ length: 100 })
    name: string;
  
    @OneToMany(() => Service, (service) => service.project, { cascade: true })
    services: Service[];
}
