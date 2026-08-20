#!/usr/bin/env bash
# Manual end-to-end test script for the ForgeForce QC API.
# Exercises the full workflow: login -> start inspection -> mark items ->
# fail one -> defect + photo + corrective action -> submit -> post-submit
# correction (the audit-trail-critical path) -> view history.
#
# Usage: start the backend (php artisan serve) then run this script.
#   BASE_URL=http://localhost:8000/api ./test-api.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:8000/api}"
EMAIL="${EMAIL:-engineer@forgeforce.test}"
PASSWORD="${PASSWORD:-password}"

json() { php -r "echo json_decode(file_get_contents('php://stdin'))->$1;"; }

echo "== 1. Login =="
LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN"
TOKEN=$(echo "$LOGIN" | json token)
AUTH_HEADERS=(-H "Authorization: Bearer $TOKEN" -H "Accept: application/json")

echo -e "\n== 2. List machines =="
curl -s "$BASE_URL/machines" "${AUTH_HEADERS[@]}"

echo -e "\n\n== 3. Machine detail (id=1) =="
curl -s "$BASE_URL/machines/1" "${AUTH_HEADERS[@]}"

echo -e "\n\n== 4. Checklist template for machine 1 =="
curl -s "$BASE_URL/inspection-templates/for-machine/1" "${AUTH_HEADERS[@]}"

echo -e "\n\n== 5. Start a new inspection on machine 1 =="
INSPECTION=$(curl -s -X POST "$BASE_URL/inspections" "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" -d '{"machine_id":1}')
echo "$INSPECTION"
INSPECTION_ID=$(echo "$INSPECTION" | json 'data->id')
FIRST_ITEM_ID=$(echo "$INSPECTION" | json 'data->item_results[0]->id')
echo "Inspection ID: $INSPECTION_ID"

echo -e "\n\n== 6. Mark items 1-3,5-6 Pass, item 4 (Safety guard) Pass =="
BASE_ITEM=$(( (INSPECTION_ID - 1) * 6 ))
for offset in 1 2 3 4 5 6; do
  ITEM_ID=$((BASE_ITEM + offset))
  curl -s -X PUT "$BASE_URL/inspection-items/$ITEM_ID" "${AUTH_HEADERS[@]}" \
    -H "Content-Type: application/json" -d '{"result":"pass","comment":"ok"}' -o /dev/null
done
echo "done"

SAFETY_GUARD_ID=$((BASE_ITEM + 4))

echo -e "\n\n== 7. Submit inspection (all items answered -> should succeed) =="
curl -s -X PATCH "$BASE_URL/inspections/$INSPECTION_ID/submit" "${AUTH_HEADERS[@]}"

echo -e "\n\n== 8. CRITICAL: flip Safety Guard Pass -> Fail on a submitted inspection WITHOUT change_reason (expect 422) =="
curl -s -w "\nHTTP %{http_code}\n" -X PUT "$BASE_URL/inspection-items/$SAFETY_GUARD_ID" "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" -d '{"result":"fail","comment":"cracked bracket"}'

echo -e "\n\n== 9. Same change WITH change_reason (expect 200) =="
curl -s -X PUT "$BASE_URL/inspection-items/$SAFETY_GUARD_ID" "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"result":"fail","comment":"cracked bracket found on recheck","change_reason":"Found cracking on closer inspection after submission"}'

echo -e "\n\n== 10. Full audit trail for that item (expect 2 rows: null->pass, pass->fail with reason) =="
curl -s "$BASE_URL/inspection-items/$SAFETY_GUARD_ID/history" "${AUTH_HEADERS[@]}"

echo -e "\n\n== 11. Create a defect for the now-failed item =="
DEFECT=$(curl -s -X POST "$BASE_URL/defects" "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"inspection_item_result_id\":$SAFETY_GUARD_ID,\"description\":\"Safety guard bracket cracked near mounting point\",\"severity\":\"major\"}")
echo "$DEFECT"
DEFECT_ID=$(echo "$DEFECT" | json 'data->id')

echo -e "\n\n== 12. Guard: try creating a defect on a Pass item (expect 422) =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE_URL/defects" "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"inspection_item_result_id\":$FIRST_ITEM_ID,\"description\":\"test\",\"severity\":\"minor\"}"

echo -e "\n\n== 13. Upload a photo to the defect =="
TMP_IMG="./ff-test-upload.png"
php -r "file_put_contents('$TMP_IMG', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAACklEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII='));"
curl -s -X POST "$BASE_URL/defects/$DEFECT_ID/attachments" "${AUTH_HEADERS[@]}" \
  -F "photo=@$TMP_IMG;type=image/png"
rm -f "$TMP_IMG"

echo -e "\n\n== 14. Record a corrective action for the defect =="
curl -s -X POST "$BASE_URL/corrective-actions" "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"defect_id\":$DEFECT_ID,\"description\":\"Replace bracket\",\"due_date\":\"2026-08-25\"}"

echo -e "\n\n== 15. Machine inspection history (should show 1 inspection, fail_count 1, defect_count 1) =="
curl -s "$BASE_URL/machines/1/inspections" "${AUTH_HEADERS[@]}"

echo -e "\n\n== 16. Guard: unauthenticated request (expect 401) =="
curl -s -w "\nHTTP %{http_code}\n" "$BASE_URL/me"

echo -e "\n\nDone."
