<?php

namespace Database\Seeders;

use App\Models\Document\PartnerDocument;
use App\Models\Document\PartnerDocumentVersion;
use App\Models\Partner\Partner;
use App\Models\Partner\PartnerNote;
use App\Models\Partner\PartnerTimelineEvent;
use App\Models\User;
use App\Services\DocumentManagementService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * DocumentSeeder — demo documents, versions, expiry alerts, notes and timeline
 * entries for the Phase 8 (Documents + History + Notes) module.
 */
class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        $partners = Partner::orderBy('id')->take(5)->get();

        if ($partners->isEmpty()) {
            return;
        }

        $admin = User::where('email', 'admin@plexuscloud.com')->first();
        $manager = User::where('email', 'manager@plexuscloud.com')->first();

        $documentTemplates = [
            ['category' => 'Legal',          'type' => 'Partner Agreement',  'name' => 'Master Partner Agreement',   'status' => 'Active',   'expiryOffset' => 250],
            ['category' => 'Legal',          'type' => 'Trade License',      'name' => 'Trade License 2026',         'status' => 'Active',   'expiryOffset' => 60],
            ['category' => 'Legal',          'type' => 'Tax Document',       'name' => 'TIN / VAT Certificate',      'status' => 'Active',   'expiryOffset' => 25],
            ['category' => 'Financial',      'type' => 'Security Deposit',   'name' => 'Security Deposit Receipt',   'status' => 'Active',   'expiryOffset' => null],
            ['category' => 'Financial',      'type' => 'Credit Approval',    'name' => 'Credit Limit Approval',      'status' => 'Active',   'expiryOffset' => 5],
            ['category' => 'Network',        'type' => 'Bandwidth Work Order', 'name' => 'Bandwidth Work Order WO-1042', 'status' => 'Active',  'expiryOffset' => null],
            ['category' => 'Network',        'type' => 'Network Diagram',    'name' => 'Network Topology Diagram',   'status' => 'Active',   'expiryOffset' => -10], // already expired
            ['category' => 'Support Center', 'type' => 'Rent Agreement',     'name' => 'Branch Rent Agreement',      'status' => 'Active',   'expiryOffset' => 140],
        ];

        foreach ($partners as $index => $partner) {
            // Give each partner 4-6 documents (rotating through the templates)
            $count = 4 + ($index % 3);
            $picked = collect($documentTemplates)->slice($index % 3)->take($count)->values();

            foreach ($picked as $i => $tpl) {
                $expiry = $tpl['expiryOffset'] !== null
                    ? Carbon::now()->addDays($tpl['expiryOffset'])->toDateString()
                    : null;

                $document = PartnerDocument::create([
                    'partner_id'     => $partner->id,
                    'document_name'  => $tpl['name'],
                    'category'       => $tpl['category'],
                    'document_type'  => $tpl['type'],
                    'version'        => '1.0',
                    'status'         => $tpl['status'],
                    'effective_date' => Carbon::now()->subMonths(6)->toDateString(),
                    'expiry_date'    => $expiry,
                    'uploaded_by'    => $admin?->id,
                    'approved_by'    => $manager?->id,
                    'approved_at'    => now(),
                    'file_name'      => $tpl['name'] . '.pdf',
                    'mime_type'      => 'application/pdf',
                    'file_size'      => 145000 + ($i * 3200),
                    'remarks'        => 'Seeded demo document for module walkthrough.',
                ]);

                // Version 1.0 row (BR-10)
                PartnerDocumentVersion::create([
                    'document_id'    => $document->id,
                    'version'        => '1.0',
                    'is_current'     => true,
                    'file_path'      => '',
                    'file_name'      => $document->file_name,
                    'mime_type'      => $document->mime_type,
                    'file_size'      => $document->file_size,
                    'effective_date' => $document->effective_date,
                    'expiry_date'    => $document->expiry_date,
                    'uploaded_by'    => $admin?->id,
                    'change_notes'   => 'Initial upload.',
                ]);

                // Some documents get a second version to show BR-10 in the UI
                if ($i % 3 === 0) {
                    PartnerDocumentVersion::where('document_id', $document->id)->update(['is_current' => false]);

                    PartnerDocumentVersion::create([
                        'document_id'    => $document->id,
                        'version'        => '1.1',
                        'is_current'     => true,
                        'file_path'      => '',
                        'file_name'      => $document->file_name,
                        'mime_type'      => $document->mime_type,
                        'file_size'      => $document->file_size,
                        'effective_date' => $document->effective_date,
                        'expiry_date'    => $document->expiry_date,
                        'uploaded_by'    => $manager?->id,
                        'change_notes'   => 'Address and clause numbers corrected after legal review.',
                    ]);

                    $document->update(['version' => '1.1']);
                }

                // Expiry alert ledger (BR-11)
                DocumentManagementService::syncExpiryAlerts($document->fresh());
            }

            // ── Notes (Section 80) ──
            $notes = [
                ['category' => 'Management', 'priority' => 'High',   'visibility' => 'Management Only', 'note' => 'Quarterly business review scheduled. Revenue growth is ahead of target, discuss bandwidth expansion.'],
                ['category' => 'Sales',      'priority' => 'Normal', 'visibility' => 'Internal',        'note' => 'Partner requested an additional 200 Mbps for the Savar zone during peak hours.'],
                ['category' => 'Finance',    'priority' => 'Urgent', 'visibility' => 'Internal',        'note' => 'Outstanding balance crossed 60 days. Follow up for payment and review credit limit.'],
                ['category' => 'General',    'priority' => 'Low',    'visibility' => 'Internal',        'note' => 'Contact person updated their email address; profile information refreshed.'],
            ];

            foreach ($notes as $n => $noteData) {
                PartnerNote::create(array_merge($noteData, [
                    'partner_id' => $partner->id,
                    'is_pinned'  => $n === 0,
                    'created_by' => $admin?->id,
                    'created_at' => Carbon::now()->subDays($n * 4),
                    'updated_at' => Carbon::now()->subDays($n * 4),
                ]));
            }

            // ── Timeline events (Section 73) ──
            $events = [
                ['type' => 'Partner Created',      'module' => 'Business',        'severity' => 'Info',    'title' => 'Partner record created',                    'days' => 400],
                ['type' => 'Partner Approved',     'module' => 'Approval',        'severity' => 'Success', 'title' => 'Partner application approved',              'days' => 395],
                ['type' => 'Partner Activated',    'module' => 'Business',        'severity' => 'Success', 'title' => 'Partner moved to Active status',            'days' => 390],
                ['type' => 'Agreement Signed',     'module' => 'Documents',       'severity' => 'Info',    'title' => 'Master Partner Agreement signed',           'days' => 380],
                ['type' => 'Bandwidth Allocated',  'module' => 'Bandwidth',       'severity' => 'Info',    'title' => 'Initial bandwidth allocation provisioned',  'days' => 360],
                ['type' => 'Equipment Added',      'module' => 'Equipment',       'severity' => 'Info',    'title' => 'Network equipment assigned to partner',     'days' => 320],
                ['type' => 'Commission Generated', 'module' => 'Commission',      'severity' => 'Info',    'title' => 'Monthly commission generated',              'days' => 120],
                ['type' => 'Commission Approved',  'module' => 'Commission',      'severity' => 'Success', 'title' => 'Commission approved for payment',           'days' => 118],
                ['type' => 'Payment Received',     'module' => 'Financial',       'severity' => 'Success', 'title' => 'Payment received from partner',             'days' => 90],
                ['type' => 'Bandwidth Upgraded',   'module' => 'Bandwidth',       'severity' => 'Info',    'title' => 'Bandwidth upgraded after approval',         'days' => 60],
                ['type' => 'Support Center Created', 'module' => 'Support Center', 'severity' => 'Info',    'title' => 'New support center branch opened',          'days' => 45],
                ['type' => 'Document Uploaded',    'module' => 'Documents',       'severity' => 'Info',    'title' => 'Trade license uploaded',                    'days' => 30],
                ['type' => 'Equipment Replaced',   'module' => 'Equipment',       'severity' => 'Warning', 'title' => 'Faulty router replaced',                    'days' => 12],
                ['type' => 'Note Added',           'module' => 'System',          'severity' => 'Info',    'title' => 'Management note added',                     'days' => 5],
            ];

            foreach ($events as $event) {
                PartnerTimelineEvent::create([
                    'partner_id'    => $partner->id,
                    'event_type'    => $event['type'],
                    'module'        => $event['module'],
                    'title'         => $event['title'],
                    'description'   => "Seeded history entry — {$event['type']} recorded for {$partner->partner_name}.",
                    'severity'      => $event['severity'],
                    'performed_by'  => $admin?->id,
                    'event_date'    => Carbon::now()->subDays($event['days']),
                    'created_at'    => Carbon::now()->subDays($event['days']),
                    'updated_at'    => Carbon::now()->subDays($event['days']),
                ]);
            }
        }
    }
}
