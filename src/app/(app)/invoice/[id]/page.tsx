'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { invoiceRepository } from '@/services/data/invoiceRepository'
import { toQrDataUrl } from '@/services/invoice/qrService'
import type { Invoice } from '@/lib/types'
import { formatMYR } from '@/lib/formatters'
import { QrBadge } from '@/components/invoice/QrBadge'
import { StatusPill } from '@/components/invoice/StatusPill'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { EmptyState } from '@/components/common/EmptyState'
import { Spinner } from '@/components/common/Spinner'
import { ExtractedItemsTable } from '@/components/review/ExtractedItemsTable'
import { useT } from '@/hooks/useT'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useT()
  const id = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const [editNotes, setEditNotes] = useState('')
  const [editDiscAmount, setEditDiscAmount] = useState('')
  const [editDiscReason, setEditDiscReason] = useState('')
  const [editPayMethod, setEditPayMethod] = useState('')
  const [editPayTerms, setEditPayTerms] = useState('')
  const [editPayDueDate, setEditPayDueDate] = useState('')
  const [editSuppRef, setEditSuppRef] = useState('')
  const [editBuyerName, setEditBuyerName] = useState('')
  const [editBuyerTin, setEditBuyerTin] = useState('')
  const [editBuyerAddress, setEditBuyerAddress] = useState('')

  const loadInvoice = async () => {
    const inv = await invoiceRepository.getById(id)
    setInvoice(inv ?? null)
    if (inv?.validation) {
      const qr = await toQrDataUrl(inv.validation.qrLink)
      setQrDataUrl(qr)
    }
    setLoading(false)
  }

  useEffect(() => { loadInvoice() }, [id])

  const startEdit = () => {
    if (!invoice) return
    setEditNotes(invoice.notes ?? '')
    setEditDiscAmount(invoice.discount?.amount?.toString() ?? '')
    setEditDiscReason(invoice.discount?.reason ?? '')
    setEditPayMethod(invoice.payment?.method ?? '')
    setEditPayTerms(invoice.payment?.terms ?? '')
    setEditPayDueDate(invoice.payment?.dueDate ?? '')
    setEditSuppRef(invoice.supplierRef ?? '')
    if (invoice.buyer.type === 'tin') {
      setEditBuyerName(invoice.buyer.name)
      setEditBuyerTin(invoice.buyer.tin)
      setEditBuyerAddress(invoice.buyer.address ?? '')
    }
    setEditMode(true)
  }

  const saveEdit = async () => {
    if (!invoice) return
    const updates: Partial<Pick<Invoice, 'notes' | 'discount' | 'payment' | 'supplierRef' | 'buyer'>> = {}

    if (editNotes !== (invoice.notes ?? '')) updates.notes = editNotes || undefined
    const discAmount = parseFloat(editDiscAmount)
    if (!isNaN(discAmount) && discAmount > 0) {
      updates.discount = { amount: discAmount, reason: editDiscReason || undefined }
    } else if (!editDiscAmount && invoice.discount) {
      updates.discount = undefined
    }
    if (editPayMethod || editPayDueDate) {
      updates.payment = {
        method: editPayMethod || undefined,
        terms: editPayTerms || undefined,
        dueDate: editPayDueDate || undefined,
      }
    } else if (!editPayMethod && !editPayDueDate && invoice.payment) {
      updates.payment = undefined
    }
    if (editSuppRef !== (invoice.supplierRef ?? '')) updates.supplierRef = editSuppRef || undefined
    if (invoice.buyer.type === 'tin') {
      if (editBuyerName !== invoice.buyer.name || editBuyerTin !== invoice.buyer.tin || editBuyerAddress !== (invoice.buyer.address ?? '')) {
        updates.buyer = { ...invoice.buyer, name: editBuyerName, tin: editBuyerTin, address: editBuyerAddress || undefined }
      }
    }

    await invoiceRepository.updateMetadata(invoice.id, updates)
    setEditMode(false)
    await loadInvoice()
  }

  const handleArchive = async () => {
    if (!invoice) return
    await invoiceRepository.archive(invoice.id)
    router.push('/')
  }

  const handleUnarchive = async () => {
    if (!invoice) return
    await invoiceRepository.unarchive(invoice.id)
    await loadInvoice()
  }

  const handleDelete = async () => {
    if (!invoice) return
    await invoiceRepository.softDelete(invoice.id)
    router.push('/')
  }

  const archiveActions = invoice && !invoice.deletedAt ? (
    <div className="flex gap-2">
      {invoice.archived ? (
        <Button variant="outline" size="sm" onClick={handleUnarchive}>Unarchive</Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handleArchive}>Archive</Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleDelete}>Delete</Button>
    </div>
  ) : invoice?.deletedAt ? (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={async () => { await invoiceRepository.restoreFromTrash(invoice!.id); await loadInvoice() }}>Restore</Button>
    </div>
  ) : null

  if (loading) return <Spinner className="h-8 w-8 mx-auto mt-12" />

  if (!invoice) {
    return (
      <EmptyState
        title={t('invoice.notFound')}
        description={t('invoice.notFoundDesc')}
        action={<Button onClick={() => router.push('/')}>{t('invoice.goHome')}</Button>}
      />
    )
  }

  const isTrash = !!invoice.deletedAt

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('invoice.invoice')} ${invoice.number}`}
        subtitle={new Date(invoice.createdAt).toLocaleString('en-MY')}
        action={
          <div className="flex items-center gap-2">
            <StatusPill status={invoice.status} />
          </div>
        }
      />

      {!isTrash && (
        <div className="flex gap-2 flex-wrap">
          {!editMode && <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>}
          {editMode && (
            <>
              <Button variant="primary" size="sm" onClick={saveEdit}>Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          )}
          {archiveActions}
        </div>
      )}

      {editMode && invoice.status === 'validated' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          You're editing a validated invoice. The MyInvois record won't change. For official corrections, issue a credit/debit note.
        </div>
      )}

      <section className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">{t('invoice.seller')}</p>
          <p className="font-semibold">{invoice.seller.businessName}</p>
          <p className="text-gray-600">TIN: {invoice.seller.tin}</p>
          <p className="text-gray-600">{invoice.seller.address}</p>
          <p className="text-gray-600">{invoice.seller.phone}</p>
          <p className="text-gray-600">{invoice.seller.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">{t('invoice.buyer')}</p>
          {invoice.buyer.type === 'general' ? (
            <p className="font-semibold">{t('invoice.generalPublic')}</p>
          ) : editMode ? (
            <div className="space-y-2">
              <Input label="Buyer Name" value={editBuyerName} onChange={e => setEditBuyerName(e.target.value)} />
              <Input label="Buyer TIN" value={editBuyerTin} onChange={e => setEditBuyerTin(e.target.value)} />
              <Input label="Buyer Address" value={editBuyerAddress} onChange={e => setEditBuyerAddress(e.target.value)} />
            </div>
          ) : (
            <>
              <p className="font-semibold">{invoice.buyer.name}</p>
              <p className="text-gray-600">TIN: {invoice.buyer.tin}</p>
              {invoice.buyer.address && <p className="text-gray-600">{invoice.buyer.address}</p>}
            </>
          )}
        </div>
      </section>

      {editMode && (
        <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Metadata</h3>
          <Input label="Discount Amount (RM)" type="number" inputMode="decimal" value={editDiscAmount} onChange={e => setEditDiscAmount(e.target.value)} />
          <Input label="Discount Reason" value={editDiscReason} onChange={e => setEditDiscReason(e.target.value)} />
          <Input label="Payment Method" value={editPayMethod} onChange={e => setEditPayMethod(e.target.value)} />
          <Input label="Payment Terms" value={editPayTerms} onChange={e => setEditPayTerms(e.target.value)} />
          <Input label="Due Date" type="date" value={editPayDueDate} onChange={e => setEditPayDueDate(e.target.value)} />
          <Input label="Supplier Reference" value={editSuppRef} onChange={e => setEditSuppRef(e.target.value)} />
          <Input label="Notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
        </section>
      )}

      {!editMode && (invoice.notes || invoice.discount || invoice.payment || invoice.supplierRef) && (
        <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-1 text-sm">
          {invoice.notes && <p className="text-gray-600"><span className="font-medium">Notes:</span> {invoice.notes}</p>}
          {invoice.discount && <p className="text-gray-600"><span className="font-medium">Discount:</span> RM {formatMYR(invoice.discount.amount)}{invoice.discount.reason ? ` (${invoice.discount.reason})` : ''}</p>}
          {invoice.payment?.method && <p className="text-gray-600"><span className="font-medium">Payment:</span> {invoice.payment.method}{invoice.payment.terms ? ` — ${invoice.payment.terms}` : ''}{invoice.payment.dueDate ? ` due ${invoice.payment.dueDate}` : ''}</p>}
          {invoice.supplierRef && <p className="text-gray-600"><span className="font-medium">Ref:</span> {invoice.supplierRef}</p>}
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('invoice.lineItems')}</h3>
        <ExtractedItemsTable />
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-end">
        <p className="text-sm text-gray-600 tabular-nums">{t('invoice.subtotal')}: RM {formatMYR(invoice.totals.subtotal)}</p>
        <p className="text-sm text-gray-600 tabular-nums">{t('invoice.tax')}: RM {formatMYR(invoice.totals.taxTotal)}</p>
        <p className="text-lg font-bold text-teal-700 tabular-nums">{t('invoice.total')}: RM {formatMYR(invoice.totals.total)}</p>
      </section>

      {qrDataUrl && invoice.validation && !isTrash && (
        <section className="flex flex-col items-center gap-2">
          <QrBadge qrDataUrl={qrDataUrl} />
          <p className="text-xs text-gray-500 font-mono break-all text-center">
            UUID: {invoice.validation.uuid}
          </p>
        </section>
      )}
    </div>
  )
}
