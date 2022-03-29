import { boardService } from "../../services/board.service";
import { utilService } from "../../services/util.service";

export const boardStore = {
    state: {
        boards: [], //maybe there will be no need for this
        currBoard: null,
        recentBoards: [],
    },
    getters: {
        boards(state) {
            return JSON.parse(JSON.stringify(state.boards)) //maybe there will be no need for this
        },
        currBoard(state) {
            return JSON.parse(JSON.stringify(state.currBoard))
        },
        currBoardLabels(getters) {
            return getters.currBoard.labels
        },
        currBoardMembers(getters){
            // const users = rootGetters.users
            // console.log('users',users);
            // if (!users || !users.length) return []
            // const result = state.currBoard.members.map(member => {
            //     return users.find(user => user._id === member._id)
            // })
            return getters.currBoard.members
        },
        currBoardChecklists(getters){
            const allChecklists = []
            getters.currBoard.groups.forEach(g => {
                g.tasks.forEach(t => {
                    if (!t.checklists || !t.checklists.length) return
                    allChecklists.push({taskId: t.id, taskTitle: t.title, checklists: t.checklists})
                    // t.checklists.forEach(cl => {
                    //     cl.parentTask = t
                    //     allChecklists.push(cl)
                    // })

                })
            })
            console.log(allChecklists)
            return allChecklists
        },
        recentBoards({ recentBoards }) { return recentBoards },
        cardEdit({ cardEdit }) { return cardEdit },
        boardsToShow(state) {
            let regex = new RegExp(state.filterBy.txt, 'i')
            return state.boards.filter(board => {
                return regex.test(board.title)
            })
        },
    },
    mutations: {
        setCurrBoard(state, { currBoard }) {
            state.currBoard = currBoard
        },
        addBoardToRecentBoards(state, { board }) {
            if (state.recentBoards.length >= 5) state.recentBoards.pop()
            state.recentBoards = state.recentBoards.filter(currBoard =>
                currBoard._id !== board._id)
            state.recentBoards.unshift(board)
        },
        // saveTaskToStore(state, { groupId, taskToSave }) {
        //     const currGroup = state.currBoard.groups.find(g => g.id === groupId)
        //     if (!taskToSave.id) {
        //         taskToSave.id = utilService.makeId()
        //         taskToSave.createdAt = Date.now()
        //         currGroup.tasks.unshift(taskToSave)
        //     }
        //     const taskIdx = currGroup.tasks.findIndex(t => t.id === taskToSave.id)
        //     currGroup.tasks[taskIdx] = taskToSave
        // },
        // removeTaskInStore(state, { groupId, taskId }) {
        //     const currGroup = state.currBoard.groups.find(g => g.id === groupId)
        //     const taskIdx = currGroup.tasks.findIndex(t => t.id === taskId)
        //     currGroup.tasks.splice(taskIdx, 1)
        // },
    },
    actions: {
        async loadCurrBoard(context, { boardId }) {
            context.commit({ type: 'setIsLoading', loadingStatus: true })
            try {
                const currBoard = await boardService.getById(boardId)
                context.commit({ type: 'setCurrBoard', currBoard })
                return JSON.parse(JSON.stringify(currBoard))
            }
            catch (err) {
                console.error('Cannot load currBoard: ', err);
                context.dispatch({ type: 'flashUserMsg', msg: 'Oops! Cannot load selected board...', style: 'warning' })
            }
            finally {
                context.commit({ type: 'setIsLoading', loadingStatus: false })
            }
        },
        async saveCurrBoard(context, { boardToSave }) {
            // console.log(boardToSave.groups[1].tasks);
            context.commit({ type: 'setIsLoading', loadingStatus: true })
            try {
                const currBoard = await boardService.save(boardToSave)
                context.commit({ type: 'setCurrBoard', currBoard: boardToSave })
                context.dispatch({ type: 'flashUserMsg', msg: `Board ${currBoard._Id} saved successfully`, style: 'success' })
                return currBoard
            }
            catch (err) {
                console.error(`Cannot save board ${context.getters.currBoard._Id}: `, err)
                context.dispatch({ type: 'flashUserMsg', msg: `Oops! Cannot save board ${context.getters.currBoard._Id}...`, style: 'warning' })
            }
            finally {
                context.commit({ type: 'setIsLoading', loadingStatus: false })
            }
        },
        async updateGroup(context, { groupToSave }) {
            context.commit({ type: 'setIsLoading', loadingStatus: true })
            try {
                const board = context.getters.currBoard
                if (groupToSave.id) {
                    const idx = board.groups.findIndex(g => g.id === groupToSave.id)
                    board.groups.splice(idx, 1, groupToSave)
                    // console.log('board>>', board, 'group>>', groupToSave);
                } else {
                    groupToSave.id = utilService.makeId()
                    board.groups.push(groupToSave)
                }
                const currBoard = await context.dispatch({ type: 'saveCurrBoard', boardToSave: board })
                return currBoard
            }
            catch (err) {
                console.error(`Cannot save group ${context.getters.currBoard._Id}: `, err)
                context.dispatch({ type: 'flashUserMsg', msg: `Oops! Cannot save board ${context.getters.currBoard._Id}...`, style: 'warning' })
            }
            finally {
                context.commit({ type: 'setIsLoading', loadingStatus: false })
            }
        },
        async updateTask(context, { taskToSave, groupIdx }) {
            context.commit({ type: 'setIsLoading', loadingStatus: true })
            try {
                // console.log(taskToSave, groupIdx);
                const board = context.getters.currBoard
                if (taskToSave.id) {
                    taskToSave = JSON.parse(JSON.stringify(taskToSave))
                    const idx = board.groups[groupIdx].tasks.findIndex(t => t.id === taskToSave.id)
                    board.groups[groupIdx].tasks.splice(idx, 1, taskToSave)
                    // return taskToSave
                    // console.log('board>>', board, 'group>>', groupToSave);
                } else {
                    groupToSave.id = utilService.makeId()
                    board.groups.push(groupToSave)
                }
                const currBoard = await context.dispatch({ type: 'saveCurrBoard', boardToSave: board })
                return currBoard
            }
            catch (err) {
                console.error(`Cannot save group ${context.getters.currBoard._Id}: `, err)
                context.dispatch({ type: 'flashUserMsg', msg: `Oops! Cannot save board ${context.getters.currBoard._Id}...`, style: 'warning' })
            }
            finally {
                context.commit({ type: 'setIsLoading', loadingStatus: false })
            }
        },
        async copyGroup(context, { groupToSave }) {
            context.commit({ type: 'setIsLoading', loadingStatus: true })
            try {
                groupToSave.id = utilService.makeId()
                // console.log(context.getters.currBoard);
                const board = context.getters.currBoard
                board.groups.push(groupToSave)
                // console.log(board);
                return await context.dispatch({ type: 'saveCurrBoard', boardToSave: board })
                // console.log(this.currBoard);
                // this.currBoard.groups.push(groupToSave)
            }
            catch (err) {
                console.error(`Cannot save group ${context.getters.currBoard._Id}: `, err)
                context.dispatch({ type: 'flashUserMsg', msg: `Oops! Cannot save board ${context.getters.currBoard._Id}...`, style: 'warning' })
            }
            finally {
                context.commit({ type: 'setIsLoading', loadingStatus: false })
            }
        },
        async getEmptyBoard(context) {
            context.commit({ type: 'setIsLoading', loadingStatus: true })
            try {
                return boardService.getEmptyBoard()
            }
            catch {
                console.error(`Cannot get empty board: `, err)
                context.dispatch({ type: 'flashUserMsg', msg: `Oops! Cannot initiate a new board...`, style: 'warning' })
            }
            finally {
                context.commit({ type: 'setIsLoading', loadingStatus: false })
            }
        },
        async getTaskById({ getters }, { groupId, taskId }) {
            const currBoard = getters.currBoard
            const currGroup = currBoard.groups.find(g => g.id === groupId)
            // console.log('taskId', taskId);
            // console.log('groupId', groupId);
            // console.log('currGroup', currGroup);
            const currTask = currGroup.tasks.find(t => t.id === taskId)
            return currTask
        },
        async saveTask(context, { groupId, taskToSave }) {
            const boardToSave = context.getters.currBoard
            const currGroup = boardToSave.groups.find(g => g.id === groupId)
            if (!taskToSave.id) {
                taskToSave.id = utilService.makeId()
                taskToSave.createdAt = Date.now()
                currGroup.tasks.unshift(taskToSave)
            } else {
                const taskIdx = currGroup.tasks.findIndex(t => t.id === taskToSave.id)
                currGroup.tasks[taskIdx] = taskToSave
            }
            return context.dispatch({ type: 'saveCurrBoard', boardToSave })
        },
        async removeTask(context, { groupId, taskId }) {
            const boardToSave = context.getters.currBoard
            const currGroup = boardToSave.groups.find(g => g.id === groupId)
            const taskIdx = currGroup.tasks.findIndex(t => t.id === taskId)
            currGroup.tasks.splice(taskIdx, 1)
            return context.dispatch({ type: 'saveCurrBoard', boardToSave })
        },
        // async saveTask(context, {groupId, taskToSave}){
        //     context.commit({ type: 'setIsLoading', loadingStatus: true })
        //     try {
        //         context.commit({type: 'saveTaskToStore', groupId, taskToSave})
        //         const savedTask = boardService.saveTask(taskToSave)
        //     }
        //     catch {
        //         console.error(`Cannot save task: `, err)
        //         context.dispatch({ type: 'flashUserMsg', msg: `Oops! Cannot save task...`, style: 'warning' })
        //     }
        //     finally {
        //         context.commit({ type: 'setIsLoading', loadingStatus: false })
        //     }
        // },

    }
}