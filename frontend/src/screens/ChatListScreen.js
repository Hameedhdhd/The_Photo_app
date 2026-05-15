import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors, spacing, radius, typography, shadows } from '../theme';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let subscription = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      await fetchConversations(user.id);

      subscription = supabase
        .channel('messages_list')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new;
            if (msg.sender_id === user.id || msg.recipient_id === user.id) {
              fetchConversations(user.id);
            }
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchConversations = useCallback(async (uid) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by chat_id, keep only the latest message per chat
      const chatMap = new Map();
      (data || []).forEach(msg => {
        if (!chatMap.has(msg.chat_id)) {
          chatMap.set(msg.chat_id, {
            chat_id: msg.chat_id,
            otherUserId: msg.sender_id === uid ? msg.recipient_id : msg.sender_id,
            lastMessage: msg.content,
            timestamp: msg.created_at,
            isImage: msg.is_image,
            item_id: msg.item_id,
          });
        }
      });

      // Fetch item details for each conversation
      const convList = Array.from(chatMap.values());
      const itemIds = [...new Set(convList.map(c => c.item_id).filter(Boolean))];

      if (itemIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('items')
          .select('item_id, title, image_url, price')
          .in('item_id', itemIds);

        const itemMap = new Map((itemsData || []).map(i => [i.item_id, i]));

        convList.forEach(conv => {
          conv.item = itemMap.get(conv.item_id) || null;
        });
      }

      setConversations(convList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchConversations(userId);
  }, [userId, fetchConversations]);

  const navigateToChat = (conversation) => {
    navigation.navigate('ChatDetail', {
      chatId: conversation.chat_id,
      otherUserId: conversation.otherUserId,
      item: conversation.item,
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const renderConversation = ({ item: conv }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat(conv)}
      activeOpacity={0.75}
    >
      {/* Item image as avatar */}
      <View style={styles.avatarContainer}>
        {conv.item?.image_url ? (
          <Image source={{ uri: conv.item.image_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="cube-outline" size={24} color={colors.textTertiary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatTop}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {conv.item?.title || 'Conversation'}
          </Text>
          <Text style={styles.chatTime}>{formatTimestamp(conv.timestamp)}</Text>
        </View>

        <View style={styles.chatBottom}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conv.isImage ? (
              '📷 Photo'
            ) : (
              conv.lastMessage
            )}
          </Text>
          {conv.item?.price && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{conv.item.price}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {conversations.length > 0 ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}` : ''}
        </Text>
      </View>

      {conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No Messages Yet"
          subtitle="Browse the marketplace and tap 'Message Seller' to start a conversation"
          iconBgColor={colors.infoLight}
          iconColor={colors.primary}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.chat_id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  headerSection: {
    paddingHorizontal: spacing.page,
    paddingTop: Platform.OS === 'ios' ? 54 : spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: 80,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.xl,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chatTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatTime: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 11,
  },
  chatBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  priceBadge: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  priceText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});
