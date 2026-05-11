import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

class Recipient extends Model<InferAttributes<Recipient>, InferCreationAttributes<Recipient>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare name: string;
  declare created_at: CreationOptional<Date>;
}

Recipient.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'recipients',
    underscored: true,
    timestamps: false,
  }
);

export default Recipient;
