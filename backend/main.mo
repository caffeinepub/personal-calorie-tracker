import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Text "mo:core/Text";
import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  // Food log entry type
  type FoodEntry = {
    date : Text;
    foodName : Text;
    calories : Nat;
    image : Storage.ExternalBlob;
  };

  module FoodEntry {
    public func compare(entry1 : FoodEntry, entry2 : FoodEntry) : Order.Order {
      switch (Text.compare(entry1.date, entry2.date)) {
        case (#equal) { Text.compare(entry1.foodName, entry2.foodName) };
	      case (order) { order };
      };
    };
  };

  // Step count record type
  type StepRecord = {
    date : Text;
    steps : Nat;
  };

  module StepRecord {
    public func compare(record1 : StepRecord, record2 : StepRecord) : Order.Order {
      Text.compare(record1.date, record2.date);
    };
  };

  // Daily summary type
  type DailySummary = {
    totalCaloriesConsumed : Nat;
    totalSteps : Nat;
    totalCaloriesBurned : Nat;
    netCalories : Int;
  };

  // Store food entries and step records in persistent collections
  let foodEntries = List.empty<FoodEntry>();
  let stepsMap = Map.empty<Text, Nat>();

  // Food entry functions
  public shared ({ caller }) func addFoodEntry(date : Text, foodName : Text, calories : Nat, image : Storage.ExternalBlob) : async () {
    let entry : FoodEntry = {
      date;
      foodName;
      calories;
      image;
    };
    foodEntries.add(entry);
  };

  public query ({ caller }) func getEntriesForDate(date : Text) : async [FoodEntry] {
    let entries = foodEntries.filter(func(entry) { entry.date == date });
    entries.toArray();
  };

  public query ({ caller }) func getEntriesForDateSortedByFood(date : Text) : async [FoodEntry] {
    let entries = foodEntries.filter(func(entry) { entry.date == date });
    entries.toArray().sort();
  };

  public query ({ caller }) func getAvailableDates() : async [Text] {
    var dates = List.empty<Text>();
    for (entry in foodEntries.values()) {
      if (not dates.any(func(d) { d == entry.date })) {
        dates.add(entry.date);
      };
    };
    dates.toArray();
  };

  // Step count functions
  public query ({ caller }) func getSteps(date : Text) : async Nat {
    switch (stepsMap.get(date)) {
      case (null) { Runtime.trap("No steps recorded for this date") };
      case (?steps) { steps };
    };
  };

  public query ({ caller }) func getAllStepRecords() : async [StepRecord] {
    let records = stepsMap.entries().map(func((date, steps)) { { date; steps } });
    records.toArray().sort();
  };

  // Daily summary function
  public query ({ caller }) func getDailySummary(date : Text) : async DailySummary {
    // Calculate total consumed calories for the date
    let dailyEntries = foodEntries.filter(func(entry) { entry.date == date });
    let totalCaloriesConsumed = dailyEntries.toArray().foldLeft(
      0,
      func(acc, entry) { acc + entry.calories },
    );

    // Get steps and calculate burned calories
    let totalSteps = switch (stepsMap.get(date)) {
      case (null) { 0 };
      case (?steps) { steps };
    };
    let totalCaloriesBurned = totalSteps * 4 / 100;

    // Calculate net calories (consumed - burned)
    let netCalories = totalCaloriesConsumed - totalCaloriesBurned;

    // Create daily summary record
    {
      totalCaloriesConsumed;
      totalSteps;
      totalCaloriesBurned;
      netCalories;
    };
  };
};
