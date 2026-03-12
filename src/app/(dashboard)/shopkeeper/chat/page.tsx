import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ChatWindow } from '@/components/ChatWindow'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">
          Chat in Hindi/English/Hinglish to manage your inventory
        </p>
      </div>
      <div className="h-[calc(100vh-200px)]">
        <ChatWindow />
      </div>
    </div>
  )
}
