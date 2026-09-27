<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Partner Profile Report — {{ $payload['partner']['partner_name'] }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; box-sizing: border-box; }
        body { font-size: 11px; color: #1f2937; margin: 24px; }
        h1 { font-size: 18px; margin: 0 0 2px; color: #1e3a8a; }
        h2 { font-size: 12px; margin: 18px 0 0; padding: 5px 8px; background: #1e40af; color: #fff; }
        .sub { color: #6b7280; font-size: 10px; margin-bottom: 12px; }

        /* KPI cards */
        .kpi-row { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-bottom: 10px; }
        .kpi { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; text-align: center; width: 33%; }
        .kpi .v { font-size: 15px; font-weight: bold; color: #1e40af; }
        .kpi .l { font-size: 9px; color: #6b7280; }

        /* Meta / status row */
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .meta-table td { padding: 3px 6px; border: 1px solid #e5e7eb; }
        .meta-table td.label { background: #f3f4f6; font-weight: bold; width: 14%; }

        /* Main data table */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
        .data-table tr:nth-child(even) td { background: #f9fafb; }
        .data-table td { padding: 4px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
        .data-table td.field { width: 32%; color: #374151; font-weight: 600; }

        /* Nested event table */
        .event-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .event-table th { background: #dbeafe; color: #1e40af; padding: 2px 5px; text-align: left; }
        .event-table td { padding: 2px 5px; border-bottom: 1px solid #f3f4f6; }

        /* Bullet list for simple arrays */
        .val-list { margin: 0; padding-left: 14px; }
        .val-list li { margin-bottom: 2px; }

        /* KV list for assoc arrays (by_category etc) */
        .kv-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .kv-table td { padding: 2px 5px; border-bottom: 1px dotted #e5e7eb; }
        .kv-table td.kv-key { color: #6b7280; width: 55%; }

        .badge { display: inline-block; padding: 1px 7px; border-radius: 10px;
                 font-size: 9px; background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 20px; font-size: 9px; color: #9ca3af;
                  text-align: center; border-top: 1px solid #e5e7eb; padding-top: 6px; }
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

{{-- KPI bar --}}
<table class="kpi-row">
    <tr>
        <td class="kpi"><div class="v">{{ $payload['kpis']['total_documents'] }}</div><div class="l">Documents</div></td>
        <td class="kpi"><div class="v">{{ $payload['kpis']['total_events'] }}</div><div class="l">Timeline Events</div></td>
        <td class="kpi"><div class="v">{{ $payload['kpis']['total_notes'] }}</div><div class="l">Notes</div></td>
    </tr>
</table>

{{-- Status/Health row --}}
<table class="meta-table">
    <tr>
        <td class="label">Status</td>
        <td><span class="badge">{{ $payload['partner']['status'] ?? '—' }}</span></td>
        <td class="label">Health</td>
        <td><span class="badge">{{ $payload['partner']['health_status'] ?? '—' }}</span></td>
    </tr>
</table>

@foreach($payload['sections'] as $key => $fields)
    <h2>{{ \App\Services\PartnerProfileExportService::SECTIONS[$key] ?? $key }}</h2>
    <table class="data-table">
        @foreach($fields as $field => $value)
            @php
                $label = ucwords(str_replace('_', ' ', is_string($field) ? $field : (string)$field));
                $isSeqArray   = is_array($value) && array_is_list($value);
                $isAssocArray = is_array($value) && !array_is_list($value) && !empty($value);
                $isEventArray = $isSeqArray && !empty($value) && is_array($value[0] ?? null);
            @endphp
            <tr>
                <td class="field">{{ $label }}</td>
                <td>
                    @if($value === null || $value === '' || $value === [])
                        <span style="color:#9ca3af">—</span>

                    @elseif(is_bool($value))
                        {{ $value ? 'Yes' : 'No' }}

                    @elseif($isEventArray)
                        {{-- Array of associative objects (e.g. events, insights list) --}}
                        <table class="event-table">
                            <tr>
                                @foreach(array_keys($value[0]) as $col)
                                    <th>{{ ucwords(str_replace('_', ' ', $col)) }}</th>
                                @endforeach
                            </tr>
                            @foreach($value as $row)
                                <tr>
                                    @foreach($row as $cell)
                                        <td>{{ $cell ?? '—' }}</td>
                                    @endforeach
                                </tr>
                            @endforeach
                        </table>

                    @elseif($isSeqArray)
                        {{-- Simple list of scalars (e.g. insight texts) --}}
                        <ul class="val-list">
                            @foreach($value as $item)
                                <li>{{ is_array($item) ? json_encode($item, JSON_UNESCAPED_UNICODE) : $item }}</li>
                            @endforeach
                        </ul>

                    @elseif($isAssocArray)
                        {{-- Associative array (e.g. by_category, by_level) --}}
                        <table class="kv-table">
                            @foreach($value as $k => $v)
                                <tr>
                                    <td class="kv-key">{{ ucwords(str_replace('_', ' ', $k)) }}</td>
                                    <td><strong>{{ $v }}</strong></td>
                                </tr>
                            @endforeach
                        </table>

                    @else
                        {{ $value }}
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