<?php

namespace App\Http\Controllers\Api\V1\Document;

use App\Exports\PartnerProfileExport;
use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Partner\Partner;
use App\Services\PartnerProfileExportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;


class ProfileExportController extends ApiController
{

    public function preview(Request $request, Partner $partner): JsonResponse
    {
        [$sections, $from, $to] = $this->resolveOptions($request);

        $payload = PartnerProfileExportService::build($partner, $sections, $from, $to);

        return $this->success($payload, 'Export preview generated.');
    }


    public function export(Request $request, Partner $partner): Response|JsonResponse
    {
        $validated = $request->validate([
            'format'      => ['nullable', 'string', 'in:pdf,excel,csv,print'],
            'scope'       => ['nullable', 'string', 'in:current_view,selected_sections,full_report,custom_range'],
            'sections'    => ['nullable', 'array'],
            'sections.*'  => ['string', 'in:' . implode(',', array_keys(PartnerProfileExportService::SECTIONS))],
            'date_from'   => ['nullable', 'date'],
            'date_to'     => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $format = $validated['format'] ?? 'pdf';
        [$sections, $from, $to] = $this->resolveOptions($request);

        $payload  = PartnerProfileExportService::build($partner, $sections, $from, $to);
        $fileBase = Str::slug($partner->partner_name . '-' . $partner->partner_id) . '-' . now()->format('Ymd_His');

        return match ($format) {
            'excel' => $this->toExcel($payload, $partner, $fileBase),
            'csv'   => $this->toCsv($payload, $fileBase),
            'print' => $this->toPrint($payload),
            default => $this->toPdf($payload, $partner, $fileBase),
        };
    }

    public function options(): JsonResponse
    {
        return $this->success([
            'sections' => collect(PartnerProfileExportService::SECTIONS)
                ->map(fn($label, $key) => ['key' => $key, 'label' => $label])
                ->values(),
            'formats' => [
                ['key' => 'pdf',   'label' => 'PDF'],
                ['key' => 'excel', 'label' => 'Excel'],
                ['key' => 'csv',   'label' => 'CSV'],
                ['key' => 'print', 'label' => 'Print'],
            ],
            'scopes' => [
                ['key' => 'current_view',      'label' => 'Current View'],
                ['key' => 'selected_sections', 'label' => 'Selected Sections'],
                ['key' => 'full_report',       'label' => 'Full Partner Report'],
                ['key' => 'custom_range',      'label' => 'Custom Date Range'],
            ],
        ], 'Export options loaded.');
    }


    private function resolveOptions(Request $request): array
    {
        $scope = $request->query('scope', $request->input('scope', 'full_report'));

        $sections = match ($scope) {
            'current_view' => [
                'partner_information',
                'business_information',
                'pnl',
                'roi',
                'health',
            ],
            'selected_sections' => (array) $request->input('sections', []),
            default => array_keys(PartnerProfileExportService::SECTIONS),
        };


        if (empty($sections)) {
            $sections = ['partner_information', 'business_information'];
        }

        $from = $request->input('date_from');
        $to   = $request->input('date_to');

        if ($scope !== 'custom_range' && $request->filled('date_from')) {
            $from = $request->input('date_from');
        }

        return [$sections, $from, $to];
    }

    private function toPdf(array $payload, Partner $partner, string $fileBase): Response
    {
        $pdf = Pdf::loadView('exports.partner-profile', [
            'payload' => $payload,
            'partner' => $partner,
        ])->setPaper('a4');

        return $pdf->download("{$fileBase}.pdf");
    }

    private function toExcel(array $payload, Partner $partner, string $fileBase): Response
    {
        $export = new PartnerProfileExport(
            $payload['rows'],
            $partner->partner_name . ' Profile'
        );

        return Excel::download($export, "{$fileBase}.xlsx");
    }

    private function toCsv(array $payload, string $fileBase): Response
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, ['Section', 'Field', 'Value']);

        foreach ($payload['rows'] as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileBase}.csv\"",
        ]);
    }

    private function toPrint(array $payload): Response
    {
        return response(
            view('exports.partner-profile-print', ['payload' => $payload])->render(),
            200,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
    }
}
