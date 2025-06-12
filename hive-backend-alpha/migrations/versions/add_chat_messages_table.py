"""add_chat_messages_table

Revision ID: add_chat_messages_table
Revises: add_comments_table
Create Date: 2025-06-07 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'add_chat_messages_table'
down_revision = 'add_comments_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for message types
    message_type_enum = postgresql.ENUM('task_chat', 'direct_message', 'system', name='messagetype')
    message_type_enum.create(op.get_bind())
    
    # Create chat_messages table
    op.create_table('chat_messages',
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('message_type', sa.Enum('task_chat', 'direct_message', 'system', name='messagetype'), nullable=False),
    sa.Column('task_id', sa.UUID(), nullable=True),
    sa.Column('recipient_id', sa.UUID(), nullable=True),
    sa.Column('sender_id', sa.UUID(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], name=op.f('fk_chat_messages_recipient_id_users')),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], name=op.f('fk_chat_messages_sender_id_users')),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], name=op.f('fk_chat_messages_task_id_tasks')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_chat_messages'))
    )
    
    # Create indexes for better query performance
    op.create_index('ix_chat_messages_task_id', 'chat_messages', ['task_id'])
    op.create_index('ix_chat_messages_sender_id', 'chat_messages', ['sender_id'])
    op.create_index('ix_chat_messages_recipient_id', 'chat_messages', ['recipient_id'])
    op.create_index('ix_chat_messages_created_at', 'chat_messages', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_chat_messages_created_at', table_name='chat_messages')
    op.drop_index('ix_chat_messages_recipient_id', table_name='chat_messages')
    op.drop_index('ix_chat_messages_sender_id', table_name='chat_messages')
    op.drop_index('ix_chat_messages_task_id', table_name='chat_messages')
    
    # Drop table
    op.drop_table('chat_messages')
    
    # Drop enum type
    message_type_enum = postgresql.ENUM('task_chat', 'direct_message', 'system', name='messagetype')
    message_type_enum.drop(op.get_bind())