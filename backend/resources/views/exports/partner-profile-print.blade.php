<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Partner Profile Report — {{ $payload['partner']['partner_name'] }}</title>
    <style>
        body {
            font-family: -apple-system, Segoe UI, Roboto, sans-serif;
            font-size: 13px;
            color: #1f2937;
            margin: 0;
            padding: 28px;
            background: #fff;
        }

        h1 {
            font-size: 22px;
            margin: 0 0 4px;
            color: #1e3a8a;
        }

        h2 {
            font-size: 14px;
            margin: 22px 0 8px;
            padding: 7px 10px;
            background: #1e40af;
            color: #fff;
            border-radius: 5px;
        }

        .sub {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 16px;
        }

        .actions {
            margin-bottom: 16px;
        }

        .actions button {
            padding: 8px 16px;
            background: #1e40af;
            color: #fff;
            border: 0;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        td {
            padding: 6px 9px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
        }

        td.field {
            width: 32%;
            background: #f9fafb;
            color: #374151;
            font-weight: 500;
        }

        .kpis {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }

        .kpi {
            flex: 1;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }

        .kpi .v {
            font-size: 22px;
            font-weight: 700;
            color: #1e40af;
        }

        .kpi .l {
            font-size: 11px;
            color: #6b7280;
        }

        .footer {
            margin-top: 26px;
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        @media print {
            .actions {
                display: none;
            }

            body {
                padding: 0;
            }
        }
    </style>
</head>

<body>
    <div class="actions">
        <button onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <h1>Partner Profile Report</h1>
    <div class="sub">
        {{ $payload['partner']['partner_name'] }}
        ({{ $payload['partner']['partner_id'] }} / {{ $payload['partner']['partner_code'] }})
        — Generated {{ $payload['generated_at'] }}
        @if ($payload['period']['date_from'] || $payload['period']['date_to'])
            | Period: {{ $payload['period']['date_from'] ?? 'Start' }} → {{ $payload['period']['date_to'] ?? 'Today' }}
        @endif
    </div>

    <div class="kpis">
        <div class="kpi">
            <div class="v">{{ $payload['kpis']['total_documents'] }}</div>
            <div class="l">Documents</div>
        </div>
        <div class="kpi">
            <div class="v">{{ $payload['kpis']['total_events'] }}</div>
            <div class="l">History Events</div>
        </div>
        <div class="kpi">
            <div class="v">{{ $payload['kpis']['total_notes'] }}</div>
            <div class="l">Notes</div>
        </div>
    </div>

    @foreach ($payload['sections'] as $key => $fields)
        <h2>{{ \App\Services\PartnerProfileExportService::SECTIONS[$key] ?? $key }}</h2>
        <table>
            @foreach ($fields as $field => $value)
                <tr>
                    <td class="field">
                        {{ ucwords(str_replace('_', ' ', is_string($field) ? $field : (string) $field)) }}</td>
                    <td>
                        @if (is_array($value))
                            <code
                                style="font-size:11px">{{ \Illuminate\Support\Str::limit(json_encode($value, JSON_UNESCAPED_UNICODE), 600) }}</code>
                        @else
                            {{ is_bool($value) ? ($value ? 'Yes' : 'No') : $value ?? '—' }}
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
