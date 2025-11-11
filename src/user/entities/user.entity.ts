// user.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToMany } from 'typeorm';
import { Certificate } from 'src/certificate/entities/certificate.entity';
import { Service } from 'src/service/entities/service.entity';
import { Issue } from 'src/issue/entities/issue.entity';
import { Card } from 'src/card/entities/card.entity'; // Import Card entity

@Entity()
export class User
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  first_name: string;

  @Column({ type: 'varchar', length: 30 })
  last_name: string;

  @Column({ type: "varchar", length: 50 })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'enum', enum: [ "admin", "developer" ], default: "developer" })
  role: string;

  @Column({ type: "varchar", nullable: true })
  profileImage: string | null;

  @Column({ type: "varchar", nullable: true })
  profileImageID: string | null;

  @Column({ type: "varchar", array: true, nullable: true })
  skills: string[];

  @OneToMany(() => Certificate, certificate => certificate.user)
  certificates: Certificate[];

  @OneToMany(() => Service, service => service.chief)
  chiefServices: Service[];

  @OneToMany(() => Issue, issue => issue.createdBy) // Relationship with Issue
  issues: Issue[];

  // Define a many-to-many relationship with Card
  @ManyToMany(() => Card, (card) => card.users, { nullable: true }) // Eager loading to fetch cards automatically
  cards?: Card[]; // Array of cards associated with this user
}