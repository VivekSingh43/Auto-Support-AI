import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KBSourcesList } from "@/components/kb-sources-list"
import { AddFAQForm } from "@/components/add-faq-form"
import { AddTextForm } from "@/components/add-text-form"
import { UploadPDFForm } from "@/components/upload-pdf-form"

export default async function KnowledgeBasePage() {
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  // Get all KB sources grouped
  const sources = await sql`
    SELECT 
      source_type,
      source_name,
      COUNT(*) as chunk_count,
      MIN(created_at) as created_at
    FROM kb_chunks
    WHERE workspace_id = ${workspaceId}
    GROUP BY source_type, source_name
    ORDER BY created_at DESC
  `

  // Get plan limits
  const planResult = await sql`
    SELECT p.max_documents
    FROM workspaces w
    JOIN plans p ON w.plan_id = p.id
    WHERE w.id = ${workspaceId}
  `
  const maxDocuments = planResult[0]?.max_documents || 10
  const currentDocuments = sources.length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Add content for your AI to learn from. Upload PDFs, add FAQs, or paste text.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentDocuments} / {maxDocuments} documents
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">All Sources</TabsTrigger>
          <TabsTrigger value="faq">Add FAQ</TabsTrigger>
          <TabsTrigger value="text">Add Text</TabsTrigger>
          <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Sources</CardTitle>
              <CardDescription>All content your AI bot has been trained on</CardDescription>
            </CardHeader>
            <CardContent>
              <KBSourcesList
                sources={
                  sources as Array<{
                    source_type: string
                    source_name: string
                    chunk_count: string
                    created_at: string
                  }>
                }
                workspaceId={workspaceId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Add FAQ Entry</CardTitle>
              <CardDescription>Add a question and answer pair. Great for common customer queries.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddFAQForm workspaceId={workspaceId} disabled={currentDocuments >= maxDocuments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Add Text Content</CardTitle>
              <CardDescription>Paste documentation, policies, or any text content. Supports markdown.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddTextForm workspaceId={workspaceId} disabled={currentDocuments >= maxDocuments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Upload PDF documents like manuals, policies, or product guides. Max 20MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadPDFForm workspaceId={workspaceId} disabled={currentDocuments >= maxDocuments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
