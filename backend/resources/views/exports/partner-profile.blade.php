<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Partner Profile Report — {{ $payload['partner']['partner_name'] }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { font-size: 11px; color: #1f2937; margin: 24px; }
        h1 { font-size: 18px; margin: 0 0 2px; color: #1e3a8a; }
        h2 { font-size: 12px; margin: 18px 0 6px; padding: 5px 8px; background: #1e40af; color: #fff; }
        .sub { color: #6b7280; font-size: 10px; margin-bottom: 12px; }
        .meta-table, .data-table { width: 100%; border-collapse: collapse; }
        .meta-table td { padding: 3px 6px; border: 1px solid #e5e7eb; }
        .meta-table td.label { background: #f3f4f6; font-weight: bold; width: 28%; }
        .data-table td { padding: 3px 6px; border: 1px solid #e5e7eb; }
        .data-table td.field { width: 35%; color: #374151; }
        .badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 9px; background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 20px; font-size: 9px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 6px; }
        .kpi-row { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-bottom: 6px; }
        .kpi { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; text-align: center; width: 33%; }
        .kpi .v { font-size: 15px; font-weight: bold; color: #1e40af; }
        .kpi .l { font-size: 9px; color: #6b7280; }
    </style>
</head>
<body>
    <h1>Partner Profile Report</h1>
    <div class="sub">
        {{ $payload['partner']['partner_name'] }}
        ({{ $payload['partner']['partner_id'] }} / {{ $payload['partner']['partner_code'] }})
        — Generated {{ $payload['generated_at'] }}
        @if($payload['period']['date_from'] || $payload['period']['date_to'])
            | Period: {{ $payload['period']['date_from'] ?? 'Start' }} → {{ $payload['period']['date_to'] ?? 'Today' }}
        @endif
    </div>

    <table class="kpi-row">
        <tr>
            <td class="kpi"><div class="v">{{ $payload['kpis']['total_documents'] }}</div><div class="l">Documents</div></td>
            <td class="kpi"><div class="v">{{ $payload['kpis']['total_events'] }}</div><div class="l">History Events</div></td>
            <td class="kpi"><div class="v">{{ $payload['kpis']['total_notes'] }}</div><div class="l">Notes</div></td>
        </tr>
    </table>

    <table class="meta-table" style="margin-bottom:8px">
        <tr>
            <td class="label">Status</td><td><span class="badge">{{ $payload['partner']['status'] ?? '—' }}</span></td>
            <td class="label">Health</td><td><span class="badge">{{ $payload['partner']['health_status'] ?? '—' }}</span></td>
        </tr>
    </table>

    @foreach($payload['sections'] as $key => $fields)
        <h2>{{ \App\Services\PartnerProfileExportService::SECTIONS[$key] ?? $key }}</h2>
        <table class="data-table">
            @foreach($fields as $field => $value)
                <tr>
                    <td class="field">{{ ucwords(str_replace('_', ' ', is_string($field) ? $field : (string) $field)) }}</td>
                    <td>
                        @if(is_array($value))
                            {{ \Illuminate\Support\Str::limit(json_encode($value, JSON_UNESCAPED_UNICODE), 500) }}
                        @else
                            {{ is_bool($value) ? ($value ? 'Yes' : 'No') : ($value ?? '—') }}
                        @endif
                    </td>
                </tr>
            @endforeach
        </table>
    @endforeach

    <div class="footer">
        Plexus Cloud — Partner Management Module 
    </div>
</body>
</html>