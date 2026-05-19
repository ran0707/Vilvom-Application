import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const API_KEY = '8f54dc0632aa4c488106bbe7c2978e5b';

type Article = {
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: { name?: string };
};

const LatestTeaNewsScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchArticles(page);
  }, [page]);

  const fetchArticles = async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Use a shorter lookback that fits NewsAPI free tier (30 days)
      const from = new Date();
      const MAX_LOOKBACK_DAYS = 30;
      from.setDate(from.getDate() - MAX_LOOKBACK_DAYS);
      let fromStr = from.toISOString().slice(0, 10);
      // restrict to tea/agri-specific keywords in the article title
      const qInTitleRaw =
        'tea OR "tea plantation" OR "tea farming" OR "tea industry" OR "tea garden" OR cultivation OR growers OR agriculture OR farmer OR agri';
      const qInTitle = encodeURIComponent(qInTitleRaw);

      // 1) Prefer India top-headlines (country=in) which returns India-focused recent news
      let url = `https://newsapi.org/v2/top-headlines?country=in&q=${qInTitle}&pageSize=15&page=${pg}&apiKey=${API_KEY}`;
      let res = await fetch(url);
      let json = await res.json();

      // If top-headlines returns an error or no articles, fallback to everything limited to Indian domains
      const indianDomains = encodeURIComponent(
        'thehindu.com,timesofindia.indiatimes.com,hindustantimes.com,economictimes.indiatimes.com,financialexpress.com,business-standard.com,livemint.com,news18.com',
      );
      // NewsAPI returns { status: 'ok'|'error', message?, articles }
      if (
        !json ||
        (json && json.status && json.status !== 'ok') ||
        (json.articles && json.articles.length === 0)
      ) {
        // try everything endpoint with 'from' window
        url = `https://newsapi.org/v2/everything?qInTitle=${qInTitle}&from=${fromStr}&domains=${indianDomains}&language=en&sortBy=publishedAt&pageSize=15&page=${pg}&apiKey=${API_KEY}`;
        res = await fetch(url);
        json = await res.json();

        if (json && json.status && json.status !== 'ok') {
          const msg: string = json.message || '';
          if (/too far in the past|requested results too far/i.test(msg)) {
            // try 7-day window
            const fallbackFrom = new Date();
            fallbackFrom.setDate(fallbackFrom.getDate() - 7);
            fromStr = fallbackFrom.toISOString().slice(0, 10);
            url = `https://newsapi.org/v2/everything?qInTitle=${qInTitle}&from=${fromStr}&domains=${indianDomains}&language=en&sortBy=publishedAt&pageSize=15&page=${pg}&apiKey=${API_KEY}`;
            res = await fetch(url);
            json = await res.json();
          }

          // final fallback: without from param (most recent)
          if (json && json.status && json.status !== 'ok') {
            url = `https://newsapi.org/v2/everything?qInTitle=${qInTitle}&domains=${indianDomains}&language=en&sortBy=publishedAt&pageSize=15&page=${pg}&apiKey=${API_KEY}`;
            res = await fetch(url);
            json = await res.json();
          }

          if (json && json.status && json.status !== 'ok') {
            setError(json.message || 'News API error');
            setArticles([]);
            return;
          }
        }
      }

      if (json && json.articles) {
        setArticles(prev =>
          pg === 1 ? json.articles : [...prev, ...json.articles],
        );
      } else {
        // no articles returned
        if (!json.articles) setArticles([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('news fetch error', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.8}
    >
      {item.urlToImage ? (
        <Image source={{ uri: item.urlToImage }} style={styles.thumb} />
      ) : (
        <View
          style={[
            styles.thumb,
            { alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <Text style={{ color: '#6b6b6b' }}>
            {item.source?.name || 'News'}
          </Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{item.source?.name || ''}</Text>
          <Text style={styles.metaText}>
            {item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString()
              : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#234c39" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Latest Tea News</Text>
          <Text style={styles.subtitle}>
            Curated news about tea industry & farming
          </Text>
        </View>
      </View>

      {loading && page === 1 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color="#1b8b47" />
        </View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Could not load news</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchArticles(1)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No news found</Text>
          <Text style={styles.emptyText}>
            Try adjusting the filters or check back later.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchArticles(1)}
          >
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(a, i) => a.url + i}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          onEndReached={() => setPage(p => p + 1)}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator style={{ margin: 12 }} color="#1b8b47" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbf8' },
  header: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#eef6ef' },
  backBtn: { position: 'absolute', left: 12, top: 18, padding: 6 },
  headerTitle: { alignItems: 'center', width: '100%' },
  title: { fontSize: 20, fontWeight: '800', color: '#0b1f12' },
  subtitle: { marginTop: 6, color: '#476a55' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 1,
  },
  thumb: { width: 110, height: 100, backgroundColor: '#f2f2f2' },
  cardBody: { flex: 1, padding: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#082114' },
  cardDesc: { marginTop: 6, color: '#566a5b' },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: { fontSize: 12, color: '#88a188' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b1f12',
    marginBottom: 8,
  },
  emptyText: { color: '#556b5b', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    backgroundColor: '#1b8b47',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});

export default LatestTeaNewsScreen;
