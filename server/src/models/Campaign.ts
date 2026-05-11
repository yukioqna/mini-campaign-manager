import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

class Campaign extends Model<InferAttributes<Campaign>, InferCreationAttributes<Campaign>> {
  declare id: CreationOptional<string>;
  declare created_by: string;
  declare name: string;
  declare subject: string;
  declare body: CreationOptional<string | null>;
  declare status: CreationOptional<'draft' | 'scheduled' | 'sending' | 'sent'>;
  declare scheduled_at: CreationOptional<Date | null>;
  declare sent_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Campaign.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    created_by: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent'),
      allowNull: false,
      defaultValue: 'draft',
    },
    scheduled_at: { type: DataTypes.DATE, allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'campaigns',
    underscored: true,
    timestamps: false,
    hooks: {
      beforeUpdate: (campaign: Campaign) => {
        campaign.updated_at = new Date();
      },
    },
  }
);

export default Campaign;
