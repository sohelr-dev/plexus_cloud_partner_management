<?php

namespace App\Http\Controllers\Api\V1\Report;

use App\Exports\DomainReportExport;
use App\Http\Controllers\Api\V1\ApiController;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends ApiController
{

    public function types(): JsonResponse
    {
        $types = collect(ReportService::REPORT_TYPES)->map(function ($label, $key) {
            return [
                'key'   => $key,
                'label' => $label,
            ];
        })->values();

        return $this->success($types, 'Report types loaded.');
    }

    public function data(Request $request, string $type): JsonResponse
    {
        $data = $this->resolveReportData($type, $request->all());

        return $this->success([
            'type'        => $type,
            'title'       => ReportService::REPORT_TYPES[$type] ?? 'Report',
            'summary'     => $data['summary'] ?? [],
            'columns'     => $data['columns'] ?? [],
            'rows'        => $data['rows'] ?? [],
            'total_count' => count($data['rows'] ?? []),
        ], 'Report data retrieved.');
    }


    public function export(Request $request, string $type): Response
    {
        $format = $request->query('format', 'pdf');
        $data = $this->resolveReportData($type, $request->all());
        $title = ReportService::REPORT_TYPES[$type] ?? 'Report';
        $fileName = Str::slug($title) . '-' . now()->format('Ymd_His');

        return match ($format) {
            'excel' => $this->toExcel($data, $title, $fileName),
            'csv'   => $this->toCsv($data, $fileName),
            'print' => $this->toPrint($data, $title),
            default => $this->toPdf($data, $title, $fileName),
        };
    }

    private function resolveReportData(string $type, array $filters): array
    {
        return match ($type) {
            'partner'        => ReportService::getPartnerReport($filters),
            'financial'      => ReportService::getFinancialReport($filters),
            'marketing'      => ReportService::getMarketingReport($filters),
            'bandwidth'      => ReportService::getBandwidthReport($filters),
            'equipment'      => ReportService::getEquipmentReport($filters),
            'commission'     => ReportService::getCommissionReport($filters),
            'support_center' => ReportService::getSupportCenterReport($filters),
            default          => abort(404, "Unknown report type: {$type}"),
        };
    }

    private function toPdf(array $data, string $title, string $fileName): Response
    {
        $pdf = Pdf::loadView('reports.domain_report', [
            'reportTitle' => $title,
            'data'        => $data,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("{$fileName}.pdf");
    }

    private function toExcel(array $data, string $title, string $fileName): Response
    {
        $headings = array_column($data['columns'], 'label');
        $keys = array_column($data['columns'], 'key');

        $rows = array_map(function ($row) use ($keys) {
            $result = [];
            foreach ($keys as $k) {
                $result[] = $row[$k] ?? '';
            }
            return $result;
        }, $data['rows']);

        return Excel::download(new DomainReportExport($rows, $headings, $title), "{$fileName}.xlsx");
    }

    private function toCsv(array $data, string $fileName): StreamedResponse
    {
        $headings = array_column($data['columns'], 'label');
        $keys = array_column($data['columns'], 'key');
        $rows = $data['rows'];

        return response()->streamDownload(function () use ($headings, $keys, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                $line = [];
                foreach ($keys as $k) {
                    $line[] = $row[$k] ?? '';
                }
                fputcsv($handle, $line);
            }
            fclose($handle);
        }, "{$fileName}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function toPrint(array $data, string $title): Response
    {
        $html = view('reports.domain_report', [
            'reportTitle' => $title,
            'data'        => $data,
        ])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
}
