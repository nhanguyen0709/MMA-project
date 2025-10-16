// Friend service backed by AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllUsers } from "./authService";

const FRIENDS_KEY = "friends_index"; // Stores per-user social graph

// Shape in storage:
// {
//   [userId]: {
//     friends: string[],
//     friendRequestsSent: string[],
//     friendRequestsReceived: string[]
//   }
// }

async function readIndex() {
  const raw = await AsyncStorage.getItem(FRIENDS_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function writeIndex(index) {
  await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(index));
}

async function ensureUserEntry(index, userId) {
  if (!index[userId]) {
    index[userId] = {
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
    };
  }
}

function unique(arr) {
  return Array.from(new Set(arr));
}

export async function getFriends(userId) {
  const index = await readIndex();
  await ensureUserEntry(index, userId);
  return index[userId].friends;
}

export async function getPendingRequests(userId) {
  const index = await readIndex();
  await ensureUserEntry(index, userId);
  return index[userId].friendRequestsReceived;
}

export async function sendFriendRequest(senderId, receiverId) {
  if (senderId === receiverId) return;
  const users = await getAllUsers();
  const senderExists = users.some(u => u.id === senderId);
  const receiverExists = users.some(u => u.id === receiverId);
  if (!senderExists || !receiverExists) throw new Error("Người dùng không tồn tại");

  const index = await readIndex();
  await ensureUserEntry(index, senderId);
  await ensureUserEntry(index, receiverId);

  // Already friends
  if (index[senderId].friends.includes(receiverId)) return;

  // Avoid duplicates
  index[senderId].friendRequestsSent = unique([...index[senderId].friendRequestsSent, receiverId]);
  index[receiverId].friendRequestsReceived = unique([...index[receiverId].friendRequestsReceived, senderId]);

  await writeIndex(index);
}

export async function acceptFriendRequest(senderId, receiverId) {
  // receiverId accepts request from senderId
  const index = await readIndex();
  await ensureUserEntry(index, senderId);
  await ensureUserEntry(index, receiverId);

  // Remove from requests
  index[senderId].friendRequestsSent = index[senderId].friendRequestsSent.filter(id => id !== receiverId);
  index[receiverId].friendRequestsReceived = index[receiverId].friendRequestsReceived.filter(id => id !== senderId);

  // Add to friends both sides
  index[senderId].friends = unique([...index[senderId].friends, receiverId]);
  index[receiverId].friends = unique([...index[receiverId].friends, senderId]);

  await writeIndex(index);
}

export async function declineFriendRequest(senderId, receiverId) {
  // receiverId declines request from senderId OR sender cancels
  const index = await readIndex();
  await ensureUserEntry(index, senderId);
  await ensureUserEntry(index, receiverId);

  index[senderId].friendRequestsSent = index[senderId].friendRequestsSent.filter(id => id !== receiverId);
  index[receiverId].friendRequestsReceived = index[receiverId].friendRequestsReceived.filter(id => id !== senderId);

  await writeIndex(index);
}

export async function removeFriend(userId, friendId) {
  const index = await readIndex();
  await ensureUserEntry(index, userId);
  await ensureUserEntry(index, friendId);

  index[userId].friends = index[userId].friends.filter(id => id !== friendId);
  index[friendId].friends = index[friendId].friends.filter(id => id !== userId);

  await writeIndex(index);
}

export async function getRelationshipStatus(currentUserId, otherUserId) {
  const index = await readIndex();
  await ensureUserEntry(index, currentUserId);
  await ensureUserEntry(index, otherUserId);

  if (index[currentUserId].friends.includes(otherUserId)) return "friends";
  if (index[currentUserId].friendRequestsSent.includes(otherUserId)) return "sent";
  if (index[currentUserId].friendRequestsReceived.includes(otherUserId)) return "received";
  return "none";
}

export async function getFriendsDetailed(userId) {
  const ids = await getFriends(userId);
  const users = await getAllUsers();
  return users.filter(u => ids.includes(u.id));
}

export async function getPendingRequestsDetailed(userId) {
  const ids = await getPendingRequests(userId);
  const users = await getAllUsers();
  return users.filter(u => ids.includes(u.id));
}
