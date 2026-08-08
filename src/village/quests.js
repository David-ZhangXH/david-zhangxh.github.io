// The "welcome home" quest log. Storage is injected (localStorage in prod).
export const QUEST_IDS = ['passcode', 'record', 'quiz', 'letter', 'memory']
export const QUEST_LABELS = {
  passcode: 'crack the passcode',
  record: 'beat the arcade record',
  quiz: 'ace the librarian’s quiz',
  letter: 'leave a letter in the mailbox',
  memory: 'unlock the secret memory'
}

const KEY = 'davidworld:quests'

export function createQuests(storage) {
  let done
  try {
    done = new Set(JSON.parse(storage.getItem(KEY) || '[]').filter((id) => QUEST_IDS.includes(id)))
  } catch { done = new Set() }
  const save = () => storage.setItem(KEY, JSON.stringify([...done]))
  return {
    isDone: (id) => done.has(id),
    complete(id) {
      if (!QUEST_IDS.includes(id) || done.has(id)) return false
      done.add(id)
      save()
      return true
    },
    progress: () => ({ done: done.size, total: QUEST_IDS.length }),
    allDone: () => done.size === QUEST_IDS.length
  }
}
