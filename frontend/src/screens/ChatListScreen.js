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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  const fetchConversations = useCallback(async (uid) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by chat_id and pick the latest message per conversation
      const conversationMap = {};
      (data || []).forEach((msg) => {
        if (!conversationMap[msg.chat_id]) {
          conversationMap[msg.chat_id] = msg;
        }
      });
      setConversations(Object.values(conversationMap));
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    fetchConversations(userId);
  }, [userId, fetchConversations]);

  const handleOpenChat = useCallback((conv) => {
    const otherUserId = conv.sender_id === userId ? conv.recipient_id : conv.sender_id;
    navigation.navigate('ChatDetail', {
      chatId: conv.chat_id,
      otherUserId,
      item: conv.item || null,
    });
  }, [navigation, userId]);

  const getTimeLabel = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d`;
  };

  const renderConversation = ({ item: conv, index }) => {
    const isMe = conv.sender_id === userId;
    const preview = conv.message_type === 'image'
      ? '📷 Photo'
      : (conv.content || '').slice(0, 60);
    const timeLabel = getTimeLabel(conv.created_at);

    return (
      <Animated.View entering={FadeInDown.duration(350).delay(index * 50)}>
        <TouchableOpacity
          style={styles.convRow}
          onPress={() => handleOpenChat(conv)}
          activeOpacity={0.75}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {conv.item?.image_url ? (
              <Image source={{ uri: conv.item.image_url }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={22} color={colors.white} />
              </LinearGradient>
            )}
            <View style={styles.onlineDot} />
          </View>

          {/* Content */}
          <View style={styles.convContent}>
            <View style={styles.convHeader}>
              <Text style={styles.convTitle} numberOfLines={1}>
                {conv.item?.title || `Chat · ${conv.chat_id?.slice(0, 8) || '—'}`}
              </Text>
              <Text style={styles.convTime}>{timeLabel}</Text>
            </View>
            <View style={styles.convFooter}>
              <Text style={styles.convPreview} numberOfLines={1}>
                {isMe ? (
                  <Text style={styles.meLabel}>You: </Text>
                ) : null}
                {preview || 'No messages yet'}
              </Text>
              {/* Unread indicator placeholder */}
              {!isMe && (
                <View style={styles.unreadBadge}>
                  <View style={styles.unreadDot} />
                </View>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Premium Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {conversations.length > 0
                ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
                : 'No messages yet'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      </LinearGradient>

      {/* Conversation List */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} style={styles.skeletonItem} />
          ))}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.chat_id || item.id?.toString()}
          renderItem={renderConversation}
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="No conversations yet"
              subtitle="Browse the marketplace and message a seller to start chatting"
              iconBgColor={colors.infoLight}
              iconColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 16,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.page,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...typography.small,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List
  listContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.page,
    paddingBottom: 100,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  // Conversation Row
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    resizeMode: 'cover',
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  // Content
  convContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  convTitle: {
    ...typography.h4,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  convTime: {
    ...typography.small,
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  convFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convPreview: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  meLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  unreadBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  // Separator
  separator: {
    height: spacing.sm,
  },
  // Skeleton
  skeletonContainer: {
    padding: spacing.page,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  skeletonItem: {
    height: 76,
    borderRadius: radius.xl,
  },
});
