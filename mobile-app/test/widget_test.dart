import 'package:alih_daya_mobile/src/app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows mobile login screen', (tester) async {
    await tester.pumpWidget(const AlihDayaMobileApp());

    expect(find.text('Alih Daya\nAttendance'), findsOneWidget);
    expect(find.text('Masuk Employee'), findsOneWidget);
    expect(find.text('Lihat Mode Demo'), findsOneWidget);
  });
}
