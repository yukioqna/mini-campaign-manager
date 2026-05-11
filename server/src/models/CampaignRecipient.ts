import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

class CampaignRecipient extends Model<InferAttributes<CampaignRecipient>, InferCreationAttributes<CampaignRecipient>> {
  declare id: CreationOptional<string>;
  declare campaign_id: string;
  declare recipient_id: string;
  declare status: CreationOptional<'pending' | 'sent' | 'failed'>;
  declare sent_at: CreationOptional<Date | null>;
  declare opened_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
}

CampaignRecipient.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id: { type: DataTypes.UUID, allowNull: false },
    recipient_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    opened_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'campaign_recipients',
    underscored: true,
    timestamps: false,
  }
);

export default CampaignRecipient;
