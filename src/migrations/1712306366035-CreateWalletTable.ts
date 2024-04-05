import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletTable1712306366035 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS wallet (
                id INT AUTO_INCREMENT PRIMARY KEY,
                address VARCHAR(255) NOT NULL,
                privateKey VARCHAR(255) NOT NULL
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS wallet`);
  }
}
