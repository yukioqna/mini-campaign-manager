import sequelize from '../config/database';
import User from './User';
import Campaign from './Campaign';
import Recipient from './Recipient';
import CampaignRecipient from './CampaignRecipient';

User.hasMany(Campaign, { foreignKey: 'created_by', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Campaign.hasMany(CampaignRecipient, { foreignKey: 'campaign_id', as: 'campaignRecipients' });
CampaignRecipient.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

Recipient.hasMany(CampaignRecipient, { foreignKey: 'recipient_id', as: 'campaignRecipients' });
CampaignRecipient.belongsTo(Recipient, { foreignKey: 'recipient_id', as: 'recipient' });

export { sequelize, User, Campaign, Recipient, CampaignRecipient };
