# Οδηγός Συνεισφοράς

## Μεθοδολογία: GitHub Flow

Η ομάδα ακολουθεί το **GitHub Flow**. Ο βασικός κανόνας:

> Ό,τι βρίσκεται στο `master` είναι **πάντα** deployable.

Ποτέ δεν γίνεται άμεση commit στο `master`. Κάθε αλλαγή περνά από Pull Request.

Για λεπτομερή τεκμηρίωση μεθοδολογίας δες [methodology.md](methodology.md).

---

## Workflow βήμα-βήμα

```
master ─────────────────────────────────────────── merge ──►
              │                                       ▲
              └─► δημιουργία branch ─► commits ─► PR ─► review ─► merge
```

1. **Δημιούργησε branch** από το `master`
2. **Κάνε commits** — μικρά, λογικά βήματα
3. **Push** και **άνοιξε Pull Request** στο GitHub
4. **Review** από τουλάχιστον ένα μέλος
5. **Merge** στο `master` μετά από έγκριση

---

## Ονομασία Branches

| Τύπος | Πρότυπο | Παράδειγμα |
|------|---------|-----------|
| Νέο feature | `feature/περιγραφή` | `feature/realtime-seat-locking` |
| Διόρθωση bug | `bug/περιγραφή` | `bug/login-redirect-loop` |
| Βελτίωση | `enhancement/περιγραφή` | `enhancement/api-pagination` |
| Τεκμηρίωση | `docs/περιγραφή` | `docs/api-reference` |

Χρησιμοποίησε **kebab-case** (μικρά γράμματα, παύλες). Χωρίς κεφαλαία, χωρίς κενά.

---

## Σύμβαση Commit Messages

Μορφή: `τύπος: περίληψη στο present tense`

| Τύπος | Χρήση |
|-------|-------|
| `feat` | Νέο feature |
| `fix` | Διόρθωση bug |
| `docs` | Αλλαγές τεκμηρίωσης |
| `refactor` | Αναδόμηση κώδικα χωρίς αλλαγή συμπεριφοράς |
| `test` | Προσθήκη ή διόρθωση tests |
| `chore` | Ρύθμιση, dependencies, tooling |
| `style` | Μορφοποίηση (δεν επηρεάζει λογική) |

**Παραδείγματα:**
```
feat: add real-time seat locking via WebSocket
fix: correct CORS headers for production
docs: add API reference for bookings endpoint
refactor: extract payment service from views
test: add integration tests for booking flow
chore: upgrade Django to 5.2
```

---

## Pull Requests

Ο τίτλος του PR ακολουθεί την ίδια σύμβαση με τα commits:
`feat: add CinemaPass subscription flow`

Στην περιγραφή του PR συμπεριέλαβε:
- Τι άλλαξε και γιατί
- Τυχόν breaking changes
- Σύνδεσμο σε σχετικό issue (αν υπάρχει)

---

## Ορισμός Ολοκλήρωσης (Definition of Done)

Μια εργασία θεωρείται **ολοκληρωμένη** όταν:

- [ ] Ο κώδικας έχει γραφτεί και ανέβει στο topic branch
- [ ] Τα tests περνούν (unit + integration όπου εφαρμόζεται)
- [ ] Έχει ανοιχτεί Pull Request με περιγραφή
- [ ] Τουλάχιστον ένα άλλο μέλος έχει κάνει review
- [ ] Έχει γίνει merge στο `master`
- [ ] Το `master` παραμένει σε deployable κατάσταση

---

## Εκτέλεση Tests

```bash
# Backend
cd BackEnd
python -m pytest

# Backend με κάλυψη
python -m pytest --cov=cinema --cov-report=term-missing

# Frontend lint
cd FrontEnd
npm run lint
```
