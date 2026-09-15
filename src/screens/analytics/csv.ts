import { toCsv } from '../../utils/csv';
import { formatRupees, toNumber } from '../../utils/format';
import { RevenueBucket } from '../../api/stats';
import { PartnerReview } from '../../api/reviews';

// ---------------------------------------------------------------------------
// Real report exports — the mock's "Monthly earnings statement", "Booking
// register" and "Reviews export" downloads, built from data this app already
// fetches. The mock's other two reports (GST summary, enquiry/response log
// against SLA) have no backing fields — see implementation_graph.md §6.20.
// ---------------------------------------------------------------------------

export const buildEarningsStatementCsv = (buckets: RevenueBucket[]): string =>
    toCsv(
        ['Month', 'Bookings', 'Earnings'],
        buckets.map(b => [b.month, String(b.count ?? ''), formatRupees(toNumber(b.earnings))]),
    );

export const buildReviewsCsv = (reviews: PartnerReview[]): string =>
    toCsv(
        ['Listing', 'Rating', 'Reviewer', 'Comment', 'Date'],
        reviews.map(r => [r.listing_title, String(r.rating), r.reviewer_name, r.comment, r.created_at]),
    );
