import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  inventory: [],
  unlockedPortals: [1], // Branch 1 unlocked by default
  currentBranch: null, // 1, 2, 3, or 'BOSS'
  
  answeredQuestions: [], // Array of question IDs answered correctly
  cooldownNodes: {}, // Object map: { [questionId]: true } if answered wrong

  viewState: 'START', // 'START', 'HUB', 'WARPING', 'BRANCH', 'QUESTION'
  activeNodeId: null,
  lockedPortalTarget: null,
  rewardPopup: null,

  setViewState: (state) => set({ viewState: state }),
  setActiveNode: (id) => set({ activeNodeId: id }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setLockedPortalTarget: (id) => set({ lockedPortalTarget: id }),
  setRewardPopup: (item) => set({ rewardPopup: item }),
  resetGame: () => set({
    inventory: [],
    unlockedPortals: [1],
    currentBranch: null,
    answeredQuestions: [],
    cooldownNodes: {},
    viewState: 'START',
    activeNodeId: null,
    lockedPortalTarget: null,
    rewardPopup: null,
  }),

  addItem: (item) => set((state) => ({
    inventory: [...state.inventory, item]
  })),

  craftItem: (itemA_id, itemB_id) => {
    const { inventory } = get();
    const itemAIndex = inventory.findIndex(i => i.id === itemA_id);
    const itemBIndex = inventory.findIndex((i, idx) => i.id === itemB_id && idx !== itemAIndex);

    if (itemAIndex === -1 || itemBIndex === -1) return null;

    const CRAFTING_RECIPES = {
      'stone+mirror': { id: 'key_branch_2', name: 'Chìa khóa Nhãn quan Duy vật', icon: '🔑' },
      'mirror+stone': { id: 'key_branch_2', name: 'Chìa khóa Nhãn quan Duy vật', icon: '🔑' },
      'water+fire': { id: 'key_branch_3', name: 'Chìa khóa Đám mây Bước nhảy', icon: '☁️' },
      'fire+water': { id: 'key_branch_3', name: 'Chìa khóa Đám mây Bước nhảy', icon: '☁️' },
      'gear+scroll': { id: 'key_boss', name: 'Chìa khóa Bánh xe Lịch sử', icon: '⚙️' },
      'scroll+gear': { id: 'key_boss', name: 'Chìa khóa Bánh xe Lịch sử', icon: '⚙️' }
    };

    const recipeKey = `${itemA_id}+${itemB_id}`;
    const resultItem = CRAFTING_RECIPES[recipeKey];

    if (resultItem) {
      set((state) => {
        const newInventory = [...state.inventory];
        const indicesToRemove = [itemAIndex, itemBIndex].sort((a, b) => b - a);
        newInventory.splice(indicesToRemove[0], 1);
        newInventory.splice(indicesToRemove[1], 1);
        newInventory.push(resultItem);
        return { inventory: newInventory };
      });
      return resultItem;
    }
    return null;
  },

  hasKeyForBranch: (branchId) => {
    const { inventory } = get();
    if (branchId === 2) return inventory.some(i => i.id === 'key_branch_2');
    if (branchId === 3) return inventory.some(i => i.id === 'badge2');
    if (branchId === 'BOSS') return inventory.some(i => i.id === 'key_boss');
    return true;
  },

  consumeKeyAndUnlock: (branchId) => {
    const { inventory, unlockedPortals } = get();
    const keyMap = { 2: 'key_branch_2', 3: 'badge2', 'BOSS': 'key_boss' };
    const keyId = keyMap[branchId];
    
    set((state) => {
      const newInv = [...state.inventory];
      const idx = newInv.findIndex(i => i.id === keyId);
      if (idx !== -1) newInv.splice(idx, 1);
      return { 
        inventory: newInv, 
        unlockedPortals: [...state.unlockedPortals, branchId] 
      };
    });
  },

  setCooldown: (questionId) => set((state) => ({
    cooldownNodes: { ...state.cooldownNodes, [questionId]: true }
  })),

  resetCooldowns: () => set({ cooldownNodes: {} }),

  answerQuestion: (questionId, isCorrect) => {
    if (isCorrect) {
      set((state) => ({
        answeredQuestions: [...state.answeredQuestions, questionId],
        cooldownNodes: {} // Reset all cooldowns when one is answered correctly
      }));
    } else {
      set((state) => ({
        cooldownNodes: { ...state.cooldownNodes, [questionId]: true }
      }));
    }
  }
}));
