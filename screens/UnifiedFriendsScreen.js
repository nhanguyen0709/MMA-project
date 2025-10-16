import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { getAllUsers, findUsersByEmailContains } from "../services/authService";
import { 
  getFriendsDetailed, 
  getPendingRequestsDetailed, 
  sendFriendRequest, 
  getRelationshipStatus,
  removeFriend,
  acceptFriendRequest,
  declineFriendRequest,
} from "../services/friendService";

const TABS = ["Bạn bè", "Lời mời", "Tìm bạn"];

export default function UnifiedFriendsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState(TABS[0]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [people, setPeople] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const loadFriends = async () => setFriends(await getFriendsDetailed(user.id));
  const loadRequests = async () => setRequests(await getPendingRequestsDetailed(user.id));
  const loadPeople = async () => {
    const all = await getAllUsers();
    const others = all.filter(u => u.id !== user.id);
    setPeople(others);
    const entries = await Promise.all(others.map(async u => [u.id, await getRelationshipStatus(user.id, u.id)]));
    setStatuses(Object.fromEntries(entries));
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
    loadPeople();
  }, []);

  const onSend = async (targetId) => {
    const status = await getRelationshipStatus(user.id, targetId);
    if (status === "none") {
      await sendFriendRequest(user.id, targetId);
    }
    const newStatus = await getRelationshipStatus(user.id, targetId);
    setStatuses(prev => ({ ...prev, [targetId]: newStatus }));
  };

  const onAccept = async (senderId) => {
    await acceptFriendRequest(senderId, user.id);
    await loadFriends();
    await loadRequests();
  };

  const onDecline = async (senderId) => {
    await declineFriendRequest(senderId, user.id);
    await loadRequests();
  };

  const onRemove = async (friendId) => {
    Alert.alert("Xóa bạn", "Bạn chắc chắn muốn xóa người này khỏi danh sách bạn bè?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => { await removeFriend(user.id, friendId); await loadFriends(); } }
    ]);
  };

  const searchPeople = async (text) => {
    setQuery(text);
    setSearching(true);
    try {
      const results = text ? await findUsersByEmailContains(text) : await getAllUsers();
      const others = (results || []).filter(u => u.id !== user.id);
      setPeople(others);
      const entries = await Promise.all(others.map(async u => [u.id, await getRelationshipStatus(user.id, u.id)]));
      setStatuses(Object.fromEntries(entries));
    } finally {
      setSearching(false);
    }
  };

  const renderFriend = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity style={styles.info} onPress={() => navigation.navigate("FriendProfile", { friend: item })}>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.id}>ID: {item.id}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.danger]} onPress={() => onRemove(item.id)}>
        <Text style={styles.buttonText}>Hủy kết bạn</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.id}>ID: {item.id}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.success]} onPress={() => onAccept(item.id)}>
          <Text style={styles.buttonText}>Chấp nhận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.danger]} onPress={() => onDecline(item.id)}>
          <Text style={styles.buttonText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPerson = ({ item }) => {
    const status = statuses[item.id] || "none";
    let btnText = "Kết bạn";
    let disabled = false;
    if (status === "sent") { btnText = "Đã gửi"; disabled = true; }
    if (status === "received") { btnText = "Đợi bạn chấp nhận"; disabled = true; }
    if (status === "friends") { btnText = "Bạn bè"; disabled = true; }
    return (
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.id}>ID: {item.id}</Text>
        </View>
        <TouchableOpacity style={[styles.button, disabled && styles.disabled]} onPress={() => onSend(item.id)} disabled={disabled}>
          <Text style={styles.buttonText}>{btnText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  let data = friends, render = renderFriend;
  if (tab === TABS[1]) { data = requests; render = renderRequest; }
  if (tab === TABS[2]) { data = people; render = renderPerson; }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "Tìm bạn" && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bằng email..."
            value={query}
            onChangeText={searchPeople}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {searching ? <Text style={styles.searchHint}>Đang tìm...</Text> : null}
        </View>
      )}

      <FlatList data={data} keyExtractor={(u) => u.id} renderItem={render} ItemSeparatorComponent={() => <View style={styles.sep} />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#eee", alignItems: "center" },
  tabActive: { backgroundColor: "#007AFF" },
  tabText: { color: "#333", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  searchHint: { marginTop: 6, color: "#666" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16 },
  info: { flexShrink: 1, paddingRight: 12 },
  email: { fontSize: 16, fontWeight: "600" },
  id: { fontSize: 12, color: "#666", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#007AFF" },
  success: { backgroundColor: "#28a745" },
  danger: { backgroundColor: "#d00" },
  disabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#eee" },
});
