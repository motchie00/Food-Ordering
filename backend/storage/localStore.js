const createId = () => {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
};

const store = {
  users: [],
  menuItems: [],
  categories: [],
  orders: [],
  counters: {},
};

const nextCounter = (key) => {
  store.counters[key] = (store.counters[key] || 0) + 1;
  return store.counters[key];
};

const removeById = (collection, id) => {
  const data = store[collection];
  const index = data.findIndex((item) => item._id === id);
  if (index === -1) {
    return null;
  }
  const [removed] = data.splice(index, 1);
  return removed;
};

const updateById = (collection, id, updater) => {
  const data = store[collection];
  const index = data.findIndex((item) => item._id === id);
  if (index === -1) {
    return null;
  }
  const current = data[index];
  const updated =
    typeof updater === 'function'
      ? { ...current, ...updater(current) }
      : { ...current, ...updater };
  data[index] = updated;
  return updated;
};

const findUserByUsername = (username) =>
  store.users.find(
    (user) => user.username && user.username.toLowerCase() === username.toLowerCase()
  );

module.exports = {
  store,
  createId,
  nextCounter,
  removeById,
  updateById,
  findUserByUsername,
};


